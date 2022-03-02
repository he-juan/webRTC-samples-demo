
# 一、indexedDB 概述

- **indexedDB** 标准的创建是为了在浏览器中实现 Javascript 对象的可扩展、高性能存储和检索。使用 **indexedDB** 时，您创建了一个对象存储，它本质上是一个命名的对象集合，然后可以将对象放入存储中，然后从存储中检索对象。该存储能够存储“大量”数量的对象。您还可以使用索引来加快检索速度。

- indexedDB 是 **key-value型数据库**，不是**关系型数据库**。


# 二、indexedDB 基本操作

## 2.1 indexedDB.open

**open()**方法的第一个参数是数据库名称，格式为字符串，不可省略；第二个参数是数据库版本，是一个大于`0`的正整数（`0`将报错），如果该参数大于当前版本，会触发数据库升级。第二个参数可省略，如果数据库已存在，将打开当前版本的数据库；如果数据库不存在，将创建该版本的数据库，默认版本为`1`。

打开数据库是异步操作，通过各种事件通知客户端。下面是有可能触发的4种事件。

- success：打开成功。
- error：打开失败。
- upgradeneeded：第一次打开该数据库，或者数据库版本发生变化。
- blocked：上一次的数据库连接还未关闭。

```
var openRequest = indexedDB.open('test', 1);
var db;
openRequest.onupgradeneeded = function (e) {
  console.log('Upgrading...');
}
openRequest.onsuccess = function (e) {
  console.log('Success!');
  db = openRequest.result;
}
openRequest.onerror = function (e) {
  console.log('Error');
  console.log(e);
}
```

`open()`方法返回的是一个对象（IDBOpenDBRequest），监听函数就定义在这个对象上面。其次`，success`事件发生后，从`openRequest.result`属性可以拿到已经打开的`IndexedDB`数据库对象。

## 2.2 新建数据库

新建数据库与打开数据库是同一个操作。如果指定的数据库不存在，就会新建。不同之处在于，后续的操作主要在`upgradeneeded`事件的监听函数里面完成，因为这时版本从无到有，所以会触发这个事件。

通常，新建数据库以后，第一件事是新建对象仓库（即新建表）。更好的写法是先判断一下，这张表格是否存在，如果不存在再新建。

```
request.onupgradeneeded = function (event) {
  db = event.target.result;
  var objectStore;
  if (!db.objectStoreNames.contains('person')) {
    objectStore = db.createObjectStore('person', { keyPath: 'id', autoIncrement: true}); // keyPath设置主键，autoIncrement表示自增
    // 创建索引
    this.index = ["cseqNumber", "moduleName", "logLevel", "TS", "content"]
    if(this.index && this.index.length > 0){
        this.index.forEach(function (item) {
            objectStore.createIndex(item, item);
        })
    }
  }
}
```

三个参数分别为索引名称、索引所在的属性、配置对象（说明该属性是否包含重复的值）。

## 2.3 indexedDB.deleteDatabase()

`indexedDB.deleteDatabase()`方法用于删除一个数据库，参数为数据库的名字。它会立刻返回一个`IDBOpenDBRequest`对象，然后对数据库执行异步删除。删除操作的结果会通过事件通知，`IDBOpenDBRequest`对象可以监听以下事件。

- success：删除成功
- error：删除报错

```
function deleteDatabase() {
    window.indexedDB.deleteDatabase(config.dbName);
}
```

# 三、IDBObjectStore 对象

## 3.1 IDBObjectStore.add() 


新增数据指的是向对象仓库写入数据记录。这需要通过事务完成。
```
function setItem(newItem) {
    console.warn("新增的数据信息为：", newItem);

    var transaction = db.transaction([config.storeName], "readwrite");
    var objectStore = transaction.objectStore(config.storeName);
    objectStore.add(newItem);  // 第一个参数是键值，第二个参数是主键
    
    request.onsuccess = function (event) {
        console.log('数据写入成功');
    };
    
    request.onerror = function (event) {
        console.log('数据写入失败');
    }
}

setItem();
```
新建时必须指定表格名称和操作模式（“**只读**”或“**读写**”）。新建事务以后，通过`IDBTransaction.objectStore(name)`方法，拿到 `IDBObjectStore` 对象，再通过表格对象的`add()`方法，向表格写入一条记录。

写入操作是一个异步操作，通过监听连接对象的**success**事件和**error**事件，了解是否写入成功。


## 3.2 IDBObjectStore.get(key) 

- Parameters：key
    - The key or key range that identifies the record to be retrieved.
    - **注意：key 为索引之一，非主键**。（主键为设置为索引时是无法通过objectStore.index来获取数据的）

> 索引值为`objectStore.createIndex(item, item);` 创建时的所有item选项。

```
function getItem() {
    var transaction = db.transaction([config.storeName]);
    var objectStore = transaction.objectStore(config.storeName);
    var request;

    if(searchVal){
        // 使用索引搜索
        var index = objectStore.index(key);   //  key 为createIndex时创建的索引之一（默认的id不算）
        request = index.get(searchVal);       // searchVal为要查找的索引对应的值
    }else {
        // 默认id搜索
        request = objectStore.get(key);
    }

    request.onerror = function(event) {
        console.log('事务失败');
    };

    request.onsuccess = function( event) {
        if (request.result) {
            console.log(JSON.stringify(request.result));
        } else {
            console.log('未获得数据记录');
        }
    };
}

getItem();
```

## 3.3 IDBObjectStore.put()

更新数据要使用IDBObject.put()方法。

```
function update(newItem){
    var request = db.transaction([config.storeName], 'readwrite')
        .objectStore(config.storeName)
        .put(newItem);   // put()方法自动更新了主键为newItem.id的记录。

    request.onsuccess = function (event) {
        console.log('数据更新成功');
    };

    request.onerror = function (event) {
        console.log('数据更新失败');
    }
}
```

上面代码中，put()方法自动更新主键为newItem.id的记录。


## 3.4 IDBObjectStore.delete()

IDBObjectStore.delete()方法用于删除指定主键的记录。该方法返回一个 IDBRequest 对象

```
function removeItem(id) {
    var request = db.transaction(config.storeName, 'readwrite')
        .objectStore(config.storeName)
        .delete(id);

    request.onsuccess = function (event) {
        console.log('数据删除成功');
    };
}
```
## 3.5 IDBObjectStore.clear()

IDBObjectStore.clear()删除当前对象仓库的所有记录。该方法返回一个 IDBRequest 对象。

```
function clear() {
    var request = db.transaction(config.storeName, 'readwrite').objectStore(config.storeName);
    var objectStoreRequest = request.clear();

    objectStoreRequest.onsuccess = function (event) {
        console.log('clear Success');
    };
    objectStoreRequest.onerror = function (event) {
        console.log('clear Error');
    };
}
```

## 3.6 IDBObjectStore.count()

IDBObjectStore.count()方法用于计算数据记录的数量。该方法返回一个 IDBRequest 对象。
```
IDBObjectStore.count(key)
```
**不带参数时，该方法返回当前对象仓库的所有记录数量**。如果主键或 IDBKeyRange 对象作为参数，则返回对应的记录数量。

## 3.7 IDBObjectStore.getAll() 

```
let allRecords = store.getAll();
allRecords.onsuccess = function() {
	console.warn('allRecords 数据获取完成 result: ', allRecords.result);
};
```

### 3.7.1 getAll错误记录

> `getAll` 获取数据的比`openCursor`游标获取要快。 `objectStore.getAll` 接口获取大量数据时容易报错。（这里主要针对PC。web上测试300MB+获取正常。）

- 报错1: `The transaction was aborted, so the request cannot be fulfilled.`
    - 说明：Wave PC上使用getAll获取数据，87.65 MB时就出现了闪退。
- 报错2：[DOMException: Maximum IPC message size exceeded](https://stackoverflow.com/questions/52717593/maximum-ipc-message-size-exceeded)
    - ["Maximum IPC message size exceeded" error on chrome when a large number of typed array objects are retrieved with getAll from an IndexedDB object store](https://github.com/zincbase/zincdb/issues/17)
    - Wave pc上使用getAll获取数据，166MB时出现这个IPC报错。
```
// https://chromium.googlesource.com/chromium/src.git/+/refs/heads/main/content/browser/indexed_db/indexed_db_database.cc
// kIDBMaxMessageSize is defined based on the original
// IPC::Channel::kMaximumMessageSize value.  We use kIDBMaxMessageSize to limit
// the size of arguments we pass into our Mojo calls.  We want to ensure this
// value is always no bigger than the current kMaximumMessageSize value which
// also ensures it is always no bigger than the current Mojo message size limit.
static_assert(
    blink::mojom::kIDBMaxMessageSize <= IPC::Channel::kMaximumMessageSize,
    "kIDBMaxMessageSize is bigger than IPC::Channel::kMaximumMessageSize");
```

>  Maximum IPC message size exceeded occurs when the message size is too large. Here the message size basically refers to the amount of data that is sent from C++ (the browser binary) to Javascript as a result of some processing.

> To avoid sending too much data, there are a few things you could do:
    (1)make sure you never call getAll on a lot of data
    (2)use a limit when calling getAll on a potentially large amount of data
    (3)use openCursor instead of getAll
    (4)store smaller objects

> I think your best bet is to try switching to openCursor. This will retrieve your items one at a time (per request). This way you will avoid ever running into this error. You lose a tiny bit of speed using a cursor, but you gain scalability.

> To get using a cursor to work just like getAll does, it is simple. All you need to do is first declare an empty array, then start the cursor, and iterate, each time adding the cursor item to the array. At the end of iteration you have essentially assembled from one at a time pieces the same array result as from calling getAll.

## 3.8 IDBObjectStore.getAllKeys()

IDBObjectStore.getAllKeys() 用于获取所有符合条件的**主键**。该方法返回一个 IDBRequest 对象。

```
// 获取所有记录的主键
objectStore.getAllKeys()

// 获取所有符合条件的主键
objectStore.getAllKeys(query)

// 指定获取主键的数量
objectStore.getAllKeys(query, count)
```

## 3.9 IDBObjectStore.openCursor() 

IDBObjectStore.openCursor()用于获取**一个**指针对象。
```
objectStore.deleteIndex(indexName)
```

**指针对象可以用来遍历数据**。该对象也是异步的，有自己的success和error事件，可以对它们指定监听函数。
```
function getAllItems(){
    var objectStore = db.transaction([config.storeName]).objectStore(config.storeName);
    objectStore.openCursor().onsuccess = function (event) {
        var cursor = event.target.result;

        if (cursor) {
            console.log("-------------------------------------------------------------------");
            // console.log('id: ' + cursor.value.id);
            // console.log('dbName: ' + cursor.value.dbName);
            // console.log('TS: ' + cursor.value.TS);
            // console.log('data: ' + JSON.stringify(cursor.value.data));
            console.log('data: ' + JSON.stringify(cursor.value));
            console.log("-------------------------------------------------------------------");
            cursor.continue();
        } else {
            console.log('没有更多数据了！');
        }
    };
}
```

该对象的`target.result`属性指向当前数据记录。该记录的`key`和`value`分别返回主键和键值（即实际存入的数据）。

- **continue(key)将当前游标位置移动到指定 key 的位置，如果没提供 key 则代表的移动下一个位置。**，如果当前数据对象已经是最后一个数据了，则光标指向`null`。
    - Object.store: 如果在该对象上使用游标，那么会根据 primaryKey 遍历整个数据，注意，这里不会存在重复的情况，因为 primaryKey 是唯一的。

   
- **openCursor()**方法的第一个参数是**主键值**，或者一个 `IDBKeyRange` 对象。如果指定该参数，将只处理包含指定主键的记录；如果省略，将处理所有的记录。该方法还可以接受第二个参数，表示遍历方向，默认值为next，其他可能的值为**prev、nextunique**和**prevunique**。后两个值表示如果遇到重复值，会自动跳过。

### 3.9.1 How to get Top 1 row from IndexedDB 

- 通过openCursor获取：

```
(function (){
	var db = debug.localLogsDB;
	db.openDB();
	var request = self.indexedDB.open(db.dbName);
	let transaction = db.currentDB.transaction(db.storeName, 'readwrite');
	let store = transaction.objectStore(db.storeName);

	var cursorRequest = store.openCursor();  // 第一个参数query为主键值
	cursorRequest.onsuccess = function (ev)
	{
		var cursor = cursorRequest.result || ev.target.result;
		if(!!cursor === false){
			return;
		}

		console.log('cursor.value: ', cursor.value)
		// cursor.continue(); 方法将光标移到下一个数据对象，从而实现遍历，不加continue时，openCursor只会获取一个数据
	};
})()
```

- 通过openKeyCursor也可以获取，方法同上。

---

### 3.10 IDBObjectStore.openKeyCursor()

`IDBObjectStore.openKeyCursor()` 用于获取一个主键指针对象。
```
IDBObjectStore.openKeyCursor()
```

- [Add openKeyCursor to IDBObjectStore](https://bugzilla.mozilla.org/show_bug.cgi?id=920800)

- **openKeyCursor存在兼容问题**：https://caniuse.com/?search=openKeyCursor

# 四、IDBKeyRange 对象

IDBKeyRange 对象代表数据仓库（object store）里面的一组主键。根据这组主键，可以获取数据仓库或索引里面的一组记录。

IDBKeyRange 可以只包含一个值，也可以指定上限和下限。它有四个静态方法，用来指定主键的范围。

- **IDBKeyRange.only(value)**:只获取指定数据
- **IDBKeyRange.lowerBound(value,isOpen)**：获取最小是value的数据，第二个参数用来指示是否排除value值本身，也就是数学中的是否是开区间
    - `isOpen` 为true时表示 **不包含**，默认为false
- **IDBKeyRange.upperBound(value,isOpen)**：和上面类似，用于获取最大值是value的数据
- **IDBKeyRange.bound(value1,value2,isOpen1,isOpen2)**：同时指定上下限。

```
function searchItems(lower, upper) {
  if (lower === '' && upper === '') {return;}

  var range;
  if (lower !== '' && upper !== '') {
    range = IDBKeyRange.bound(lower, upper);
  } else if (lower === '') {
    range = IDBKeyRange.upperBound(upper);
  } else {
    range = IDBKeyRange.lowerBound(lower);
  }

  dbPromise.then(function(db) {
    var tx = db.transaction(['store'], 'readonly');
    var store = tx.objectStore('store');
    var index = store.index('price');
    return index.openCursor(range);
  }).then(function showRange(cursor) {
    if (!cursor) {return;}
    console.log('Cursored at:', cursor.key);
    for (var field in cursor.value) {
      console.log(cursor.value[field]);
    }
    return cursor.continue().then(showRange);
  }).then(function() {
    console.log('Done cursoring');
  });
}
```

# 五、indexedDB的使用

1.indexedDB 的 API 大量使用了异步函数

2.在数据库中保存对象时，不会保存对象本身。而是保存**对象的序列化表示**。这相当于与`JSON.stringify`一起使用`JSON.parse`。

3.IndexedDB 提供了查询条数的 API：`objectStore.count`，但是并没有提供查询容量的 API

4.[**隐式问题：自增 key**](https://www.ucloud.cn/yun/109011.html)。我们新建 object store 的时候存储结构使用的是自增 key。每个 object store 的自增 key 会随着新加入的数据不断的增加，删除和 clear 数据也不会重置这个 key。`key` 的最大值是**2的53次方（9007199254740992）**。当达到这个数值时，再 add 就会 add 不进数据了。此时 request.onerror 会得到一个 ConstraintError。

##5.1 几个问题

1.HTML5 indexedDB的生存周期是多久？

2.indexedDB怎么在不损失速度的情况下下载大数量日志？（这讲是本文重点要解决的问题）

3.怎么来判断数据库中存了多少数据？

-------------------------

##  参考

- https://developers.google.com/web/ilt/pwa/working-with-indexeddb
- https://www.bookstack.cn/read/javascript-tutorial/spilt.7.docs-bom-indexeddb.md

- [使用IndexedDB做前端日志持久化](https://nolanlawson.com/2015/09/29/indexeddb-websql-localstorage-what-blocks-the-dom/)
- [前端大容量缓存方案-IndexedDB](https://zhuanlan.zhihu.com/p/104536473)


## 补充

- electron 中indexeddb的限制为‘可用磁盘空间的 1/3’ ：[Question: IndexedDB size limit](https://github.com/electron/electron/issues/4550)



