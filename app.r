
library(r2d3)

set.seed(250)
data <- 
  data.frame(
    x = seq(0,100, 10),
    add = rnorm(11, mean = 50, sd = 15),
    size = rep(5,11)
  )
data$y <- data$x + data$add

ui <- fluidPage(
  tags$script(src = "https://cdn.plot.ly/plotly-latest.min.js"),
  tags$style(
    '#figurecontainer {
      margin: 0px;
      width: 960px;
      height: 800px;
    }
    #spawntext {
      display: inline-block;
      position: relative;
      top: -775px;
      left: 76px;
    }
    .scatterlayer .trace:last-child .points path {
      pointer-events: all;
    } 
    #spawntext span {
      position: relative;
      left: 50px;
    }
    #controls div {
      display: inline-block;
      margin: 20px 40px 0 40px;
      vertical-align: top;
    }
    #controls p {
      margin: 0;
    }
    #tensionbox {
      margin: 0 !important;
    }'
  ),
  verbatimTextOutput("selected"),
  div(
    id = "figurecontainer",
    HTML(
    '<div id="spawntext">&darr; Drag this handle to the curve to add another breakpoint. Drag a handle back to the left
      to delete it. <br><span>Endpoints can only be moved vertically, so they cant be deleted.</span></div>
    <svg id="trash" width="50" height="50" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg"><path d="M704 736v576q0 14-9 23t-23 9h-64q-14 0-23-9t-9-23v-576q0-14 9-23t23-9h64q14 0 23 9t9 23zm256 0v576q0 14-9 23t-23 9h-64q-14 0-23-9t-9-23v-576q0-14 9-23t23-9h64q14 0 23 9t9 23zm256 0v576q0 14-9 23t-23 9h-64q-14 0-23-9t-9-23v-576q0-14 9-23t23-9h64q14 0 23 9t9 23zm128 724v-948h-896v948q0 22 7 40.5t14.5 27 10.5 8.5h832q3 0 10.5-8.5t14.5-27 7-40.5zm-672-1076h448l-48-117q-7-9-17-11h-317q-10 2-17 11zm928 32v64q0 14-9 23t-23 9h-96v948q0 83-47 143.5t-113 60.5h-832q-66 0-113-58.5t-47-141.5v-952h-96q-14 0-23-9t-9-23v-64q0-14 9-23t23-9h309l70-167q15-37 54-63t79-26h320q40 0 79 26t54 63l70 167h309q14 0 23 9t9 23z"/></svg>'
    )
  ),
  d3Output("d3")
)

server <- function(input, output) {
  output$d3 <- renderD3({
    r2d3(
      data = 
        list(
          x = c(0, 5, 8, 20, 30, 45, 60, 75, 85, 95, 100),
          y = c(10, 12, 5, 35, 28, 22, 20, 15, 12, 11, 13),
          range = 
            list(
              x = c(-10, 100), 
              y = c(0, 60)
            )
        ),
      script = "draggable.js",
      container = "figurecontainer"  
    )
  })
  output$selected <- renderText({
    number <- paste(as.numeric(req(input$point_clicked_x)), as.numeric(req(input$point_clicked_y)))
  })
}

shinyApp(ui, server)
