
function DBExport(x){
	this.download = x
}

/**
 * bytes自适应转换到KB,MB,GB
 * @param fileSize
 * @returns {string}
 */
DBExport.prototype.formatFileSize = function (fileSize){
	if (fileSize < 1024) {
		return fileSize + ' B';
	} else if (fileSize < (1024*1024)) {
		let temp = fileSize / 1024;
		temp = temp.toFixed(2);
		return temp + ' KB';
	} else if (fileSize < (1024*1024*1024)) {
		let temp = fileSize / (1024*1024);
		temp = temp.toFixed(2);
		return temp + ' MB';
	} else {
		let temp = fileSize / (1024*1024*1024);
		temp = temp.toFixed(2);
		return temp + ' GB';
	}
}

DBExport.prototype.fileDownload = function (logs, fileName){
	if(!logs || !logs.length){
		console.warn("empty logs: ", logs)
		return
	}
	fileName = fileName || 'dbExport.log'
	let log_file = new Blob(logs, { type: 'text/plain' });
	let b = document.createElement('a');
	let ev = document.createEvent('MouseEvents');
	console.log('click download')
	ev.initEvent("click", false, false);
	b.href = URL.createObjectURL(log_file);
	b.download = fileName;
	// b.dispatchEvent(ev)
	console.warn(fileName + ' download complete')
}

DBExport.prototype.getAllWidthIDBKeyRange = function (download){
	let db = debug.localLogsDB;
	let transaction = db.currentDB.transaction(db.storeName, 'readonly');
	let store = transaction.objectStore(db.storeName);
	let lowerIndex = 0;
	let upperIndex = 0;
	let totalCount = 0;
	let lastDataId = 0;
	let localLogs = []

	/**
	 * >>> 128*1024*1024/2/300 = 223696.21333333335
	 * >>> 128*1024*1024/2/500 = 134217.728
	 * @type {number}
	 */
	let kMaximumMessageSize = 150000;   // 限制单次获取的数量(取了个中间值)
	let index = 0
	function searchItems(lower, upper) {
		console.log('searchItems lower: ' + lower + ', upper: ' + upper)
		let range;
		if (lower && upper) {
			range = IDBKeyRange.bound(lower, upper)
		} else if (lower) {
			range = IDBKeyRange.upperBound(upper)
		} else if(upper){
			range = IDBKeyRange.lowerBound(lower)
		}

		let getAllRequest = range ? store.getAll(range) : store.getAll()
		getAllRequest.onsuccess = function (event){
			for(let i = 0; i<getAllRequest.result.length; i++){
				let currentLog = getAllRequest.result[i]
				let namespace = currentLog.moduleName + ':' + currentLog.logLevel + ': '
				let logTime = new Date(parseInt(currentLog.TS));
				let log = '[' + index + ']' + '[' + logTime + '] ' + namespace + currentLog.content + "\r\n";
				localLogs.push(log)
				index++
			}

			// 这里进行下一轮处理
			if(upperIndex < lastDataId){
				lowerIndex = upperIndex + 1 // 否则会多一条数据
				upperIndex = upperIndex + 1 + kMaximumMessageSize
				console.warn("Traverse the next: [", lowerIndex, ', ', upperIndex + ']')
				searchItems(lowerIndex, upperIndex)
			}else {
				console.info("get All data complete length ", localLogs.length)
				let et = Date.now();
				console.timeEnd(1)
				let allTime = (et - st)
				console.warn("getAllRequest file process time: ", allTime/1000 , "(s)")
				console.warn("Total time: ")
				console.timeEnd(3)

				let log_file = new Blob(localLogs, { type: 'text/plain' });
				console.warn('getAllRequest file size: ', DBExport.prototype.formatFileSize(log_file.size))

				if(download){
					console.warn('prepare download')
					DBExport.prototype.fileDownload(localLogs, 'getAllWidthIDBKeyRange.log')
				}
			}
		}

		getAllRequest.onerror = function (event){
			console.warn(event)
			console.error('openCursorRequest获取数据报错： ', event.target.error)
		}
	}

	let st = Date.now();
	console.time(1)
	console.time(3)
	let countRequest = store.count();
	console.warn("count 开始处理")
	// 1.获取第一条数据以便获取起始数据的主键id
	let cursorRequest = store.openCursor();  // 第一个参数query为主键值
	cursorRequest.onsuccess = function (ev) {
		let cursor = cursorRequest.result || ev.target.result;
		if(!!cursor === false){
			return;
		}
		lowerIndex = cursor.value.id
		totalCount = countRequest.result
		console.info("totalCount：", totalCount)
		lastDataId = countRequest.result + cursor.value.id - 1
		console.info("最后一条数据的id为：", lastDataId)

		// 3.根据日志使用openCursor或者getAll接口分段获取（两个接口都可以设置范围）
		if(totalCount > kMaximumMessageSize){
			upperIndex = lowerIndex + kMaximumMessageSize
			searchItems(lowerIndex, upperIndex)
		}else {
			upperIndex = lastDataId
			searchItems(lowerIndex, upperIndex)
		}
	};

	cursorRequest.onerror = function (event){
		console.warn(event)
		console.error('openCursor 获取数据报错： ', event.target.error)
	}
}
