var news = new Vue({
	el: '#news',
	data: {
		banner: {}, //顶部banner数据
		items: [] //列表信息流数据
	}
});

var db = new Dexie('demo1');
db.version(2).stores({
	banner: 'guid,title,author,cover,time',
	news: 'id,guid,title,author,cover,time'
});
//db.news.clear();

var demo = {
	data: {
		lastId: '',
		column: "id,post_id,title,author_name,cover,published_at" //需要的字段名
	},
	_localLengh: 0,
	pulldownRefresh: function() {
		var self = this;
		if(window.plus && plus.networkinfo.getCurrentType() === plus.networkinfo.CONNECTION_NONE) {
			plus.nativeUI.toast('似乎已断开与互联网的连接', {
				verticalAlign: 'top'
			});
			return;
		}

		//请求顶部banner信息
		mui.getJSON("http://spider.dcloud.net.cn/api/banner/36kr", self.data, function(rsp) {
			news.banner = {
				guid: rsp.post_id,
				title: rsp.title,
				cover: rsp.cover,
				author: rsp.author_name,
				time: rsp.published_at
			};
		});

		if(self.data.lastId == '') {
			db.news.toArray().then(function(result) {
				self._localLengh = result.length;
				if(self._localLengh <= 0) {
					_getNews();
					return;
				}

				self.data.lastId = result[0].id;
				self.data.time = new Date(result[0].time).getTime();

				mui('#list').pullRefresh().endPulldown();
				news.items = result;
			});
		} else {
			_getNews();
		}

		function _getNews() {
			//请求列表信息流
			mui.getJSON("http://spider.dcloud.net.cn/api/news", self.data, function(rsp) {
				mui('#list').pullRefresh().endPulldown();

				if(!(rsp && rsp.length > 0)) return;

				//保存最新消息的id，方便下拉刷新时使用
				var list = convert(rsp);
				self.data.lastId = list[0].id;
				self.data.time = new Date(list[0].time).getTime();

				var distinctList = [];
				//去除重复数据(此处应该由服务端负责，客户端不应该去做数据去重，排序等)
				for(var i = 0; i < list.length; i++) {
					if(_indexOfById(list[i].id)) continue;
					distinctList.push(list[i]);
					news.items.push(list[i]);
				}

				if(distinctList.length <= 0) return;

				var shouldPersistData = [];
				var maxSize = 10;

				if(distinctList.length > maxSize) {
					for(var i = 0; i < maxSize; i++) {
						shouldPersistData.push(distinctList[i]);
					}
				} else {
					shouldPersistData = list;
				}

				//self._localLengh + distinctList.length <= maxSize 则存储list全部
				//distinctList.length >= maxSize 则存储list前maxSize条数据
				//self._localLengh + distinctList.length > maxSize, 则存储list全部且需删除 本地的最后 self._localLengh + distinctList.length - maxSize 条数据

				if(distinctList.length >= maxSize) {
					shouldPersistData = distinctList.slice(0, maxSize);
				} else if(self._localLengh + distinctList.length <= maxSize) {
					shouldPersistData = distinctList;
				} else if(self._localLengh + distinctList.length > maxSize) {
					//删除本地的最后 self._localLengh + distinctList.length - maxSize 条数据
					db.news.where('id').below(distinctList[distinctList.length - 1]).and(function(value) {
						return value.time <= distinctList[distinctList.length - 1].time;
					}).delete().then(function(deleteCount) {
						self._localLengh = self._localLengh - deleteCount;
					});

					//存储list全部数据
					shouldPersistData = distinctList;
				}

				self._localLengh = self._localLengh + shouldPersistData.length;
				db.news.bulkPut(shouldPersistData);
			});
		}

		function _indexOfById(id) {
			var matches = news.items.filter(function(item, index) {
				return item.id == id;
			})

			if(matches.length > 0) return matches[0];
			return null;
		}
	}
}