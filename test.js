var myDB = {
    name: 'testDB',
    version: 1,
    db: null
};
//1.indexDB的大部分操作都是请求——响应的模式
//得到的是一个IDBOpenDBRequest对象，而我们希望得到的DB对象在其result属性中，
function openDB(dbName, version) {
    version = version || 1;
    var request = window.indexedDB.open(dbName, version);
    request.onerror = function (e) {
        console.log('Open indexDB `' + dbName + '` Error : ' + e.currentTarget.error.message);
    };

    request.onsuccess = function (e) {
        myDB.db = e.target.result;
    };

    request.onupgradeneeded = function (e) {
        var db = e.target.result;
        if (!db.objectStoreNames.contains('students')) {
            db.createObjectStore('students', {
                keyPath: "id"
            });
        }
        console.log('DB version changed to ' + version)
    }
}

function closeDB(db) {
    db.close();
}

function deleteDB(name) {
    indexedDB.deleteDatabase(name);
}

function addData(db, storeName) {
    var transaction = db.transaction(storeName, 'readwrite');
    var store = transaction.objectStore(storeName);

    for (var i = 0; i < students.length; i++) {
        store.add(students[i]);
    }
}

function getDataByKey(db, storeName, keyPath) {
    var transaction = db.transaction(storeName, 'readwrite');
    var store = transaction.objectStore(storeName);

    var request = store.get(keyPath);
    request.onsuccess = function (e) {
        //e.target.result===request.result;
        var student = e.target.result;
        console.log(student);
    }
}

function updateDataByKey(db, storeName, keyPath) {
    var transaction = db.transaction(storeName, 'readwrite');
    var store = transaction.objectStore(storeName);
    var request = store.get(keyPath);

    request.onsuccess = function (e) {
        var student = e.target.result;
        student.age = 35;
        store.put(student);
    };
}

function deleteDataByKey(db, storeName, keyPath) {
    var transaction = db.transaction(storeName, 'readwrite');
    var store = transaction.objectStore(storeName);
    store.delete(keyPath);
    // store.clear();
}