    
    /* Adapted from code here: 
    https://gist.github.com/niclasmattsson/7bceb05fba6c71c78d507adae3d29417
    */
    
    
    function interpolateCubicHermite(xeval, xbp, ybp) {
        // first we need to determine tangents (m)
        var n = xbp.length;
        var obj = calcTangents(xbp, ybp);
        m = obj.m;          // length n
        delta = obj.delta;  // length n-1
        var c = new Array(n-1);
        var d = new Array(n-1);
        for (var k=0; k < n-1; k++) {            
            var xdiff = xbp[k+1] - xbp[k];
            c[k] = (3*delta[k] - 2*m[k] - m[k+1]) / xdiff;
            d[k] = (m[k] + m[k+1] - 2*delta[k]) / xdiff / xdiff;
        }
        
        var len = xeval.length;
        var f = new Array(len);
        var k = 0;
        for (var i=0; i < len; i++) {
            var x = xeval[i];
            if (x < xbp[0] || x > xbp[n-1]) {
                throw "interpolateCubicHermite: x value " + x + " outside breakpoint range [" + xbp[0] + ", " + xbp[n-1] + "]";
            }
            while (k < n-1 && x > xbp[k+1]) {
                k++;
            }
            var xdiff = x - xbp[k];
            f[i] = ybp[k] + m[k]*xdiff + c[k]*xdiff*xdiff + d[k]*xdiff*xdiff*xdiff; 
        }
        return f;
    }
    
    function calcTangents(x, y){
       var n = x.length;
        var delta = new Array(n-1);
        var m = new Array(n);
        for (var k=0; k < n-1; k++) {
            var deltak = (y[k+1] - y[k]) / (x[k+1] - x[k]);
            delta[k] = deltak;
            if (k == 0) {   // left endpoint, same for all methods
                m[k] = deltak;
            } else {
                m[k] = (1 - 0) * (y[k+1] - y[k-1]) / (x[k+1] - x[k-1]);
            }            
        }
        m[n-1] = delta[n-2];        
        return {m: m, delta: delta};    
    }
    
    function clamp(x, lower, upper) {
        return Math.max(lower, Math.min(x, upper));
    }
    
    function linspace(start, end, n) {
        n = typeof n === "undefined" ? 500 : n;
        if (n <= 0) return [];
        var arr = Array(n-1);
        for (var i=0; i<=n-1; i++) {
            arr[i] = ((n-1-i)*start + i*end) / (n-1);
        }
        return arr;
    }
    
    function sortHandles() {
        var len = handles.length;
        handles.sort(function(a,b) {
            return a.x-b.x;
        });
        var x = [], y = [], xvis = [], yvis = [], xmin = Infinity, xmax = -Infinity;
        for (var i=0; i < len; i++) {
            if (handles[i].type != 'spawn') {
                x.push(handles[i].x);
                y.push(handles[i].y);
                xmin = handles[i].x < xmin ? handles[i].x : xmin;
                xmax = handles[i].x > xmax ? handles[i].x : xmax;
            }
            if (handles[i].type != 'hidden') {
                xvis.push(handles[i].x);
                yvis.push(handles[i].y);
            }
        }
        return {x: x, y: y, xvis: xvis, yvis: yvis, xmin: xmin, xmax: xmax};
    }
    
    function updateFigure() {
        var sortedhandles = sortHandles();
        var xx = linspace(sortedhandles.xmin, sortedhandles.xmax, 1000);
        var yy = interpolateCubicHermite(xx, sortedhandles.x, sortedhandles.y);
        Plotly.restyle(figurecontainer, {'x': [xx, sortedhandles.xvis], 'y': [yy, sortedhandles.yvis]});
    }
    
    function updatePointHandles() {
        for (var i=0, p=0, len=handles.length; i<len; i++) {
            if (handles[i].type != 'hidden') {
                points[p++].handle = handles[i];
            }
        }
    }
    
    function destroyHandle(handle) {
        var i = handles.indexOf(handle);
        handles.splice(i,1);
        updateFigure();
    }
    
    function poofHandle(handle) {
        Plotly.d3.select(points[0]).transition().duration(500)
            .attr("transform", "translate(" + xspawn + "," + yspawn + ") scale(0)")
            .each("end", function() {
                destroyHandle(handle);
            });
    }
    
    function addHandle(type, x, y) {
        if (type == 'spawn') {
            x = figurecontainer._fullLayout.xaxis.p2l(xspawn);
            y = figurecontainer._fullLayout.yaxis.p2l(yspawn);
        }
        var newhandle = {
            x: x,
            y: y,
            type: type
        };
        handles.push(newhandle);
        return newhandle;
    }
    
    function startDragBehavior() {
        var d3 = Plotly.d3;
        var drag = d3.behavior.drag();
        drag.origin(function() {
            var transform = d3.select(this).attr("transform");
            var translate = transform.substring(10, transform.length-1).split(/,| /);
            return {x: translate[0], y: translate[1]};
        });
        drag.on("dragstart", function() {
            if (this.handle.type != 'spawn') {
                trash.setAttribute("display", "inline");
                trash.style.fill = "rgba(0,0,0,.2)";
                destroyHandle(points[0].handle);
            }
        });
        drag.on("drag", function() {
            var xmouse = d3.event.x, ymouse = d3.event.y;
            d3.select(this).attr("transform", "translate(" + [xmouse, ymouse] + ")");
            var xaxis = figurecontainer._fullLayout.xaxis;
            var yaxis = figurecontainer._fullLayout.yaxis;
            var handle = this.handle;
            if (handle.type != 'endpoint') handle.x = clamp(xaxis.p2l(xmouse), xaxis.range[0], xaxis.range[1] - 1e-9);
            if (handle.type == 'spawn' && handle.x > handles[1].x) {
                trash.setAttribute("display", "inline");
                trash.style.fill = "rgba(0,0,0,.2)";
                handle.type = 'normal';
            }
            handle.y = clamp(yaxis.p2l(ymouse), yaxis.range[0], yaxis.range[1]);
            if (handle.x < firstx) {    // release from the interpolation if dragged beyond the leftmost breakpoint
                handle.type = 'spawn';
                trash.style.fill = "#a00";              
            }
            updateFigure();
        });
        drag.on("dragend", function() {
            if (this.handle.x < firstx) destroyHandle(this.handle);
            addHandle('spawn');
            updateFigure();
            updatePointHandles();
            trash.setAttribute("display", "none");
            d3.select(".scatterlayer .trace:last-of-type .points path:last-of-type").call(drag);    
        });
        d3.selectAll(".scatterlayer .trace:last-of-type .points path").call(drag);
    }
    
    function putOutTheTrash() {
        var trashsize = trash.getAttribute("width");
        pointscontainer.parentNode.insertBefore(trash, pointscontainer);
        trash.setAttribute("transform", "translate(" + (xspawn - trashsize/2) + "," + (yspawn - trashsize/2 + 5) + ")");
        trash.setAttribute("display", "none");
    }
    
    var layout = {
        autosize: true,
        showlegend: false,
        margin: {
            t: 20,
            r: 10,
            b: 30,
            l: 30,
            pad: 0
        },
        xaxis: {
            range: [-10, 100],
            fixedrange: true,
            layer: 'below traces'
        },
        yaxis: {
            fixedrange: false,
            layer: 'below traces'
        },
        font: {size: 16}
    };
    
    var interpolatedline = {
        x: [0, 100],
        y: [0, 20], 
        type: 'scatter',
        mode: 'lines',
        hoverinfo: 'none'
    };
    var breakpoints = {
        x: [0, 100],
        y: [0, 20], 
        type: 'scatter',
        cliponaxis: false,
        mode: 'markers',
        marker: {
            size: 20,
            symbol: "circle-open-dot",
            color: '#b00',
            line: {
                width: 2
            }
        },
        hoverinfo: 'none'
    };
    
    /*
    Sources for monotonic spline test data:
    Akima, Wolberg-Alfy:  Wolberg & Alfy (2000), "An energy-minimization framework for monotonic cubic spline interpolation",  doi:10.1016/S0377-0427(01)00506-4
    Hussain:  Hussain et al. (2011) "Shape preserving rational cubic spline for positive and convex data", doi:10.1016/j.eij.2011.10.002
    */
    
    var figurecontainer = document.getElementById("figurecontainer");
    Plotly.plot(figurecontainer, [interpolatedline, breakpoints], layout, {staticPlot: true});
    
    var pointscontainer = figurecontainer.querySelector(".scatterlayer .trace:last-of-type .points");
    var points = pointscontainer.getElementsByTagName("path");
    var trash = document.getElementById("trash");
    var xspawn = 50, yspawn = 50;       // pixel coordinates of the spawn handle
    putOutTheTrash();
    
    var firstx;         // Position of the leftmost breakpoint. Drag a handle beyond this to delete it.
    var handles = [];   // the global list of handles
    
    /* We have 4 different types of handles:
        normal      standard draggable handle
        endpoint    only draggable in y direction, can't be deleted
        spawn       the dummy handle used for spawning new handles, not included in the interpolation
    */
        
    Plotly.relayout(figurecontainer, {
      'xaxis.range': data.range.x,
      'yaxis.range': data.range.y
    })
    var type;
    firstx = data.x[0];
    handles = [];
    addHandle('spawn');
    for (var i=0, len=data.x.length; i<len; i++) {
        type = i == 0 || i == len-1 ? "endpoint" : "normal";
        addHandle(type, data.x[i], data.y[i]);
    }
    updateFigure();
    updatePointHandles();
    startDragBehavior();
