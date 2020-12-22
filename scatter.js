//Define drag behaviour

/*function dragstarted(event, d) {
  d3.select(this).raise().attr("stroke", "black");
}

function dragged(event, d) {
  d3.select(this).attr("cx", d.x = event.x).attr("cy", d.y = event.y);
}

function dragended(event, d) {
  d3.select(this).attr("stroke", null);
}*/

function dragstarted(d) {
    d3.select(this).raise().classed('active', true);
}

function dragged(d) {
    d[0] = x.invert(d3.event.x);
    d[1] = y.invert(d3.event.y);
    d3.select(this)
      .attr('cx', x(d[0]))
      .attr('cy', y(d[1]))
    focus.select('path').attr('d', line);
}

function dragended(d) {
    d3.select(this).classed('active', false);
}

//Set some initial values
var margin = options.margin,
    width = width-(2*margin), height = height-(2*margin),
    xmax = options.xmax,
    xmin = options.xmin,
    ymax = options.ymax,
    ymin = options.ymin;

//Create the axes
x = d3.scaleLinear()
    .range([margin, margin+width])
    .domain([xmin, xmax]);
y = d3.scaleLinear()
    .range([height, 0])
    .domain([ymin, ymax]);

//Append axes
svg.append("g")
  .attr("transform", "translate(" + 0 + "," + (margin+y(0)) + ")")
  .call(d3.axisBottom(x));
svg.append("g")
  .attr("transform", "translate(" + x(0) + ", " + margin + ")")
  .call(d3.axisLeft(y));

//Axes labels
svg.append("text")
  .attr("transform", "translate(" + (width/2) + " ," + (height+2*margin) + ")")
  .attr("dx", "1em") .style("text-anchor", "middle")
  .style("font-family", "Tahoma, Geneva, sans-serif")
  .style("font-size", "12pt") .text(options.xLabel); 

svg.append("text") .attr("transform", "translate(" + 0 + " ," + ((height+2*margin)/2) + ") rotate(-90)")
  .attr("dy", "1em")
  .style("text-anchor", "middle")
  .style("font-family", "Tahoma, Geneva, sans-serif")
  .style("font-size", "12pt")
  .text(options.yLabel);

//Create the chart title
svg.append("text")
  .attr("x", (width/2))
  .attr("y", (margin/2))
  .attr("text-anchor", "middle")
  .attr("dx", "1em")
  .style("font-size", "16pt")
  .style("font-family", "Tahoma, Geneva, sans-serif")
  .text(options.chartTitle);

//Create the chart
svg.selectAll("dot")
  .data(data)
  .enter()
  .append("circle")
  .attr("cx", function (d) { return x(0); } )
  .attr("cy", function (d) { return y(0)+margin; } )
  .attr("r", 2)
  .style("fill", options.colour)
  .on("click", function(){
      Shiny.setInputValue(
        "point_clicked_x", 
        d3.select(this).attr("cx"),
        {priority: "event"}
        );
      Shiny.setInputValue(
      "point_clicked_y", 
      d3.select(this).attr("cy"),
      {priority: "event"}
      );
    })
  .call(d3.drag()
    .on("start", dragstarted)
    .on("drag", dragged)
    .on("end", dragended));

//On-load transition for circles
svg.selectAll('circle')
  .transition()
  .delay(function(d,i){return (i*30);}) .duration(function(d,i){return (2000+(i*2));})
  .ease(d3.easeBack)
  .attr("cx", function (d) { return x(d.x); } )
  .attr("cy", function (d) { return y(d.y)+margin; } )
  .attr("r", function (d) { return d.size; });
