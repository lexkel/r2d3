
var barHeight = Math.ceil(height / data.length);

const xScale = d3.scaleLinear()
    .domain(d3.extent(data))
    .range([0, width])

svg.selectAll('rect')
  .data(data)
  .enter().append('rect')
    .attr('width', function(d) { return xScale(d); })
    .attr('height', barHeight)
    .attr('y', function(d, i) { return i * barHeight; })
    .attr('fill', 'steelblue')
    .attr("d", function(d) { return d; })
    .on("click", function(){
      Shiny.setInputValue(
        "clicked", 
        d3.select(this).attr("d"),
        {priority: "event"}
        );
    });
