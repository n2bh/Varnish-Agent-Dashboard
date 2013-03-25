window.App = {};
App.refreshTime = 2000;
App.oldStats = {};
App.newStats = {};

App.getStats = function(){
	$.getJSON("/stats", function(data){
		App.oldStats = App.newStats;
		App.newStats = data;
	})
}

App.calcHitRatio = function(){
	delta_client_req = App.newStats.client_req.value - App.oldStats.client_req.value;
	delta_cache_hit = App.newStats.cache_hit.value - App.oldStats.cache_hit.value;
	hitRatio = (delta_cache_hit*100)/delta_client_req;
	return Math.round(hitRatio);
}

App.calcAverageHitRatio = function(){
	hitRatio = App.newStats.cache_hit.value * 100 / App.oldStats.client_req.value;
	return Math.round(hitRatio);
}

App.updateHitRatio = function(){
	
	App.hitRatioGauge.refresh(App.calcHitRatio());
	//$("#hit-ratio").html("<h1>"+App.calcHitRatio()+"</h1>");
}

App.updateData = function(){
	App.getStats();
	App.updateHitRatio();
	App.builMetricsTable("cache", App.getCacheMetrics());
	App.builMetricsTable("traffic", App.getTrafficMetrics());
	App.builMetricsTable("backend", App.getCacheMetrics());
}

App.getCacheMetrics = function() {
	var hits_ratio = {
		label: "Hits Ratio",
		new_value: App.calcHitRatio(),
		average_value: App.calcAverageHitRatio()
	}
	var hits_qty = {
		label: "Hits Qty.",
		new_value: nFormatter(App.newStats.cache_hit.value - App.oldStats.cache_hit.value),
		average_value: nFormatter(App.newStats.cache_hit.value / App.newStats.uptime.value)
	}
	var miss_qty = {
		label: "Miss Qty.",
		new_value: nFormatter(App.newStats.cache_miss.value - App.oldStats.cache_miss.value),
		average_value: nFormatter(App.newStats.cache_miss.value / App.newStats.uptime.value)
	}
	var obj_cache = {
		label: "Objs. in Cache",
		new_value: nFormatter(App.newStats.n_object.value - App.oldStats.n_object.value),
		average_value: nFormatter(App.newStats.n_object.value)
	}
	return [hits_ratio, hits_qty, miss_qty, obj_cache]
}

App.getTrafficMetrics = function() {
	var client_conn = {
		label: "Connections",
		new_value: nFormatter(App.newStats.client_conn.value - App.oldStats.client_conn.value),
		average_value: nFormatter(App.newStats.client_conn.value / App.newStats.uptime.value)
	}
	var client_req = {
		label: "Requests",
		new_value: nFormatter(App.newStats.client_req.value - App.oldStats.client_req.value),
		average_value: nFormatter(App.newStats.client_req.value / App.newStats.uptime.value)
	}
	var req_per_conn = {
		label: "Req / Conn",
		new_value: nFormatter((App.newStats.client_req.value - App.oldStats.client_req.value) /(App.newStats.client_conn.value - App.oldStats.client_conn.value) ),
		average_value: nFormatter(App.newStats.client_req.value / App.newStats.client_conn.value)
	}
	
	var bandwith = {
		label: "Bandwidth",
		new_value: nFormatter((App.newStats.s_hdrbytes.value + App.newStats.s_bodybytes.value) - (App.oldStats.s_hdrbytes.value + App.oldStats.s_bodybytes.value)),
		average_value: nFormatter((App.newStats.s_hdrbytes.value + App.newStats.s_bodybytes.value) / App.newStats.uptime.value)
	}
	
	return [client_conn, client_req, req_per_conn, bandwith]
	
}


App.builMetricsTable = function(table_id, values_object){
	var source   = $("#metrics-table-template").html();
	var context = { metric: values_object};
	var template = Handlebars.compile(source);
	var html = template(context);
	$("#"+table_id+"-metrics-table").html(html);
}

$(function(){
	App.hitRatioGauge = new JustGage({
	    id: "hit-ratio", 
	    value: 0, 
	    min: 0,
	    max: 100,
	    title: " ",
		label: "%"
	  });
	setInterval(App.updateData,App.refreshTime);
	
});


function nFormatter(num) {
     if (num >= 1000000000) {
        return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'G';
     }
     if (num >= 1000000) {
        return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
     }
     if (num >= 1000) {
        return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
     }
     return Math.round(num);
}