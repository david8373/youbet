var chart = function(data) {
    var width = 550;
    var height = 250;
    var left_margin = 20;
    var bottom_margin = 30;
    var right_margin = 20;
    var bar_width = 30;

    var x = d3.scale.linear()
	.domain(d3.extent(data, function(d) { return d[0]; }))
	.range([left_margin, width-right_margin]);
    var y = d3.scale.linear()
	.domain([0, d3.max(data, function(d) { return Math.abs(d[1]); })])
	.range([0, height-bottom_margin]);

    var xAxis = d3.svg.axis()
	.scale(x)
	.orient("bottom");

    var chart = d3.select(".chart")
	.attr("width", width)
	.attr("height", height);

    var bar = chart.selectAll("g")
	.data(data)
	.enter();

    bar.append("rect")
	.attr("class", function(d) { return d[1]>0? "bid": "ask"; })
	.attr("x", function(d) { return x(d[0]) - (bar_width / 2); })
	.attr("y", function(d) { return height - bottom_margin - y(Math.abs(d[1])); })
	.attr("width", function(d) { return bar_width; })
	.attr("height", function(d) { return y(Math.abs(d[1]));  });

    bar.append("text")
	.attr("class", "bar")
	.attr("x", function(d) { return x(d[0]); })
	.attr("y", function(d) { return height - bottom_margin - y(Math.abs(d[1])) + 10; })
	.attr("dx", ".35em")
	.text(function(d) { return Math.abs(d[1]); });

    chart.append("g")
	.attr("class", "x axis")
	.attr("transform", "translate(0," + (height - bottom_margin) + ")")
	.call(xAxis);
}

