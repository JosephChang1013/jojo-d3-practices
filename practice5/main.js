//Load Data
d3.csv('movies.csv', type).then(
    res => {
        console.log(res);
        // debugger;
    }
)
//Data utilities
//遇到NA就設定為undefined, 要不然就維持原本的字串
const parseNA = string => (string === 'NA' ? undefined : string);
//日期處理
const parseDate = string => d3.timeParse('%Y-%m-%d')(string);

// + 轉換成數字
function type(d) {
    const date = parseDate(d.release_date);
    return {
        budget: +d.budget,
        genre: parseNA(d.genre),
        genres: JSON.parse(d.genres).map(d => d.name),//已知為json檔用JSON.parse()套用 .map取出 name 資料
        homepage: parseNA(d.homepage),
        id: +d.id,
        imdb_id: parseNA(d.imdb_id),
        original_language: parseNA(d.original_language),
        overview: parseNA(d.overview),
        popularity: +d.popularity,
        poster_path: parseNA(d.poster_path),
        production_countries: JSON.parse(d.production_countries),
        release_date: date,
        release_year: date.getFullYear(),
        revenue: +d.revenue,
        runtime: +d.runtime,
        tagline: parseNA(d.tagline),
        title: parseNA(d.title),
        vote_average: +d.vote_average,
        vote_count: +d.vote_count,
    }
}

//Data selection
function filterData(data) {
    return data.filter(
        d => {
            return (
                d.release_year > 1999 && d.release_year < 2010 &&
                d.revenue > 0 &&
                d.budget > 0 &&
                d.genre &&
                d.title
            );
        }
    );
}
// prepare DATA的型別 符合d3風格 
function prepareLineChartData(data) {
    //取得發行年份
    const groupByYear = d => d.release_year;
    //只取出revenue加總
    const sumOfRevenue = values => d3.sum(values, d => d.revenue);
    //依年份加總revenue
    const sumOfRevenueByYear = d3.rollup(data, sumOfRevenue, groupByYear);
    //只取出budget加總
    const sumOfBudget = values => d3.sum(values, d => d.budget);
    //依年份加總budget
    const sumOfBudgetByYear = d3.rollup(data, sumOfBudget, groupByYear);
    //放進array並排序
    const revenueArray = Array.from(sumOfRevenueByYear).sort((a, b) => a[0] - b[0]);
    const budgetArray = Array.from(sumOfBudgetByYear).sort((a, b) => a[0] - b[0]);
    //用年份來產生日期時間格式的資料，作為後續繪圖的X軸
    const parseYear = d3.timeParse('%Y');
    const dates = revenueArray.map(d => parseYear(d[0]));
    //找出最大值(把各年份的revenue與各年份的budget都先放在一起)
    const revenueAndBudgetArray = revenueArray.map(d => d[1]).concat(budgetArray.map(d => d[1]));
    const yMax = d3.max(revenueAndBudgetArray);

    //最終資料回傳
    const lineData = {
        series: [
            {
                name: 'Revenue',
                color: 'dodgerblue',
                values: revenueArray.map(d => ({ date: parseYear(d[0]), value: d[1] }))
            },
            {
                name: 'Budget',
                color: 'darkorange',
                values: budgetArray.map(d => ({ date: parseYear(d[0]), value: d[1] }))
            }
        ],
        // x軸為時間格式,y軸為revenue value 
        dates: dates,
        yMax: yMax
    }
    return lineData;
}




//刻度顯示格式轉換
function formatTicks(d) {
    return d3.format('~s')(d)
        .replace('M', 'mil')
        .replace('G', 'bil')
        .replace('T', 'tri')


}



// setupCanvas 主要處理一些畫面上的物件
function setupCanvas(lineChartData) {
    const svg_width = 400;
    const svg_height = 500;
    const chart_margin = { top: 80, right: 60, buttom: 40, left: 80 };
    const chart_width = svg_width - (chart_margin.left + chart_margin.right);
    const chart_height = svg_height - (chart_margin.top + chart_margin.buttom);

    const this_svg = d3.select('.line-chart-container').append('svg')
        .attr('width', svg_width).attr('height', svg_height).append('g')
        .attr('transform', `translate(${chart_margin.left},${chart_margin.top})`);
    //scale
    //用時間來做X軸
    const xExtent = d3.extent(lineChartData.dates);
    // 抓出最小時間:(2000) 與 最大時間:(2009)
    const xScale = d3.scaleTime().domain(xExtent).range([0, chart_width]);
    //垂直空間的分配 - 平均分布給各種類
    const yScale = d3.scaleLinear().domain([0, lineChartData.yMax]).range([chart_height, 0]);
    //最小的放最下方，與座標相反
    // 出現/更新/消失 設定資料來源
    //設定每一條BAR:
    //  座標x,
    //  座標y
    //  寬度,高度,樣式
    //line generator
    const lineGen = d3.line()
        .x(d => xScale(d.date))
        .y(d => yScale(d.value));
    //Draw header 加上標題 x軸,y軸
    //Draw Line
    const chartGroup = this_svg.append('g').attr('class', 'line-chart');

    chartGroup.selectAll('.line-series').data(lineChartData.series).enter()
        .append('path')
        .attr('class', d => `line-series ${d.name.toLowerCase()}`)
        .attr('d', d => lineGen(d.values))
        .style('fill', 'none').style('stroke', d => d.color);
    //Draw X axis
    const xAxis = d3.axisBottom(xScale);
    // const xAxis = d3.axisBottom(xScale).tickSizeOuter(0);
    this_svg.append('g').attr('class', 'x axis')
        .attr('transform', `translate(0,${chart_height})`)
        .call(xAxis);
    //Draw Y axis
    const yAxis = d3.axisLeft(yScale).ticks(5).tickFormat(formatTicks)
        .tickSizeInner(-chart_width);
        // const yAxis = d3.axisLeft(yScale).ticks(5).tickFormat(formatTicks)
        // .tickSizeInner(-chart_width).tickSizeOuter(0);    
    this_svg.append('g').attr('class', 'y axis').call(yAxis);


    //Draw Series Label
    //放在最後一個點的旁邊(x+5,y不變)
    chartGroup.append('g').attr('class', 'series-labels')// enter(): 將參數顯示在畫面
        .selectAll('.series-label').data(lineChartData.series).enter()
        .append('text')
        // 增加線上文字標題的位置:最後一個點 X向右平移,Y高度不變
        .attr('x', d => xScale(d.values[d.values.length - 1].date) + 5)
        .attr('y', d => yScale(d.values[d.values.length - 1].value))
        .text(d => d.name)
        // 線中心跟字的中心對齊
        .style('dominant-baseline', 'central')
        .style('font-size', '0.7em').style('font-weight', 'bold')
        // 字的顏色,沿用線的顏色
        .style('fill', d => d.color);


    //Draw Header - Line
    const header_Line = this_svg.append('g')
        .attr('class', 'bar-header')
        .attr('transform', `translate(0,${-chart_margin.top / 2})`)
        .append('text');
    header_Line.append('tspan').text('Budget and Revenue over time in $US');
    header_Line.append('tspan').text('Films w/ budget and revenue figures, 2000-2009')
        .attr('x', 0)
        .attr('y', 20)
        .style('font-size', '0.8em')
        .style('fill', '#555');




}



//Main

function ready(movies) {
    const moviesClean = filterData(movies);
    const lineChartData = prepareLineChartData(moviesClean);

    console.log(lineChartData);
    setupCanvas(lineChartData);
}

//Load Data
d3.csv('movies.csv', type).then(
    res => {
        ready(res);

    }
)