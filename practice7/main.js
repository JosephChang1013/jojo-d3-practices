//Load Data
d3.csv('movies.csv', type).then(
    res => {
        // console.log(res);
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

// function prepareBarCharData(data) {
//     console.log(data);
//     const dataMap = d3.rollup(          // rollup() v = , d=條件
//         data,
//         v => d3.sum(v, leaf => leaf.revenue),
//         d => d.genre
//     );
//     const dataArray = Array.from(dataMap, d => ({ genre: d[0], revenue: d[1] }));
//     // [...dataMap][0][0]
//     // [...dataMap][0][1]

//     return dataArray;
// }

//刻度顯示格式轉換
function formatTicks(d) {
    return d3.format('.2s')(d)
        .replace('M', 'mil')
        .replace('G', 'bil')
        .replace('T', 'tri')


}

// const bodyData = [
//     ['Budget', formatTicks(thisBarData.budget)],
//     ['Revenue', formatTicks(thisBarData.revenue)],
//     ['Profit', formatTicks(thisBarData.revenue - thisBarData.budget)],
//     ['TMDB Popularity', Math.round(thisBarData.popularity)],
//     ['IMDB Rating', thisBarData.vote_average],
//     ['Genres', thisBarData.genres.join(', ')]
// ];


function setupCanvas(barChartData, movieClean) {
    let metric = 'revenue';
    // debugger
    function click() {
        metric = this.dataset.name;
        const thisData = chooseData(metric, movieClean);
        update(thisData);

    };
    d3.selectAll('button').on('click', click);

    // debugger;
    function update(data) {
        console.log(data);
        // debugger;
        // let metric = 'revenue';
        //Update Scale
        xMax = d3.max(data, d => d[metric]);
        // debugger;
        xScale_v3 = d3.scaleLinear([0, xMax], [0, chart_width]);
        yScale = d3.scaleBand().domain(data.map(d => d.title))
            .rangeRound([0, chart_height])
            .paddingInner(0.25);
        //Transition Settings
        const defaultDelay = 1000
        const transitionDelay = d3.transition().duration(defaultDelay);

        //Update axis
        xAxisDraw.transition(transitionDelay).call(xAxis.scale(xScale_v3));
        yAxisDraw.transition(transitionDelay).call(yAxis.scale(yScale));

        //Update Headet 
        header.select('tspan').text(`Top 15 ${metric}movies
        ${metric === 'popularity' ? '' : 'in $US'}`);

        //Update Bar
        bars.selectAll('.bar').data(data, d => d.title).join(
            enter => {
                enter.append('rect').attr('class', 'bar')
                    .attr('x', 0).attr('y', d => yScale(d.title))
                    .attr('height', yScale.bandwidth())
                    .style('fill', 'lightcyan')
                    .transition(transitionDelay)
                    .delay((d, i) => i * 20)
                    .attr('width', d => xScale_v3(d[metric]))
                    .style('fill', 'dodgerblue')
            },
            update => {
                update.transition(transitionDelay)
                    .delay((d, i) => i * 20)
                    .attr('y', d => yScale(d.title))
                    .attr('width', d => xScale_v3(d[metric]))
            },
            exit => {
                exit.transition().duration(defaultDelay / 2)
                    .style('fill-opacity', 0)
                    .remove
            }
        )
    };

    const svg_width = 700;
    const svg_height = 500;
    const chart_margin = { top: 80, right: 40, bottom: 40, left: 250 };
    const chart_width = svg_width - (chart_margin.left + chart_margin.right);
    const chart_height = svg_height - (chart_margin.top + chart_margin.bottom);

    const this_svg = d3.select('.bar-chart-container').append('svg')
        .attr('width', svg_width).attr('height', svg_height).append('g')
        .attr('transform', `translate(${chart_margin.left},${chart_margin.top})`);

    //scale 水平空間 資料最大最小值
    //V1.d3.extent find the max & min in revenue
    const xExtent = d3.extent(barChartData, d => d.revenue);
    const xScale_v1 = d3.scaleLinear().domain(xExtent).range([0, chart_width]);
    //range: 實際要放東西的地方
    //domain: 資料

    //V2.0 ~ max
    let xMax = d3.max(barChartData, d => d.revenue);
    let xScale_v2 = d3.scaleLinear().domain([0, xMax]).range([0, chart_width]);
    //V3.Short writing for v2
    let xScale_v3 = d3.scaleLinear([0, xMax], [0, chart_width]);

    // 垂直空間的分配
    let yScale = d3.scaleBand().domain(barChartData.map(d => d.title))
        .rangeRound([0, chart_height]).paddingInner(0.25);

    let bars = this_svg.append('g').attr('class', 'bars');



    // 出現/更新/消失 設定資料來源
    //設定每一條BAR:
    //  座標x,
    //  座標y
    //  寬度,高度,樣式
    // const bars = this_svg.selectAll('.bar')
    //     .data(barChartData)
    //     .enter()
    //     .append('rect').attr('class', 'bar')
    //     .attr('x', 0).attr('y', d => yScale(d.genre))
    //     .attr('width', d => xScale_v3(d.revenue))
    //     .attr('height', yScale.bandwidth())
    //     .style('fill', 'red');

    // Draw header 加上標題 x軸,y軸
    let header = this_svg.append('g').attr('class', 'bar-header')
        .attr('transform', `translate(0,${-chart_margin.top / 2})`)
        .append('text');
    // header.append('tspan').text('Total revenue by genre in $US');
    header.append('tspan').text('TOP 15 XXX movies');
    header.append('tspan').text('Years:2000-2009')
        .attr('x', 0).attr('y', 20)
        .style('font-size', '0.8em').style('fill', '#555');

    //tickSizeInner : the length of the tick lines
    //tickSizeOuter : the length of the square ends of the domain path
    // 劃出格線
    let xAxis = d3.axisTop(xScale_v3).ticks(5).tickFormat(formatTicks)
        .tickSizeInner(-chart_height).tickSizeOuter(0);
    let xAxisDraw = this_svg.append('g').attr('class', 'x axis');

    let yAxis = d3.axisLeft(yScale).tickSize(0);
    // const yAxisDraw = this_svg.append('g')
    //     .attr('class', 'y axis')
    //     .call(yAxis);

    let yAxisDraw = this_svg.append('g').attr('class', 'y axis');
    yAxisDraw.selectAll('text').attr('dx', '-0.6em');
    update(barChartData);

    // interactive 互動處理
    const tip = d3.select('.tooltip');
    function mouseover(e) {
        //get data
        const thisBarData = d3.select(this).data()[0];
        const bodyData = [
            ['Budget', thisBarData.budget],
            ['Revenue', thisBarData.revenue],
            ['Profit', thisBarData.revenue - thisBarData.budget],
            ['TMDB Popularity', Math.round(thisBarData.popularity)],
            ['IMDB Rating', thisBarData.vote_average],
            ['Genres', thisBarData.genres.join(', ')]
        ]

        // debugger;
        tip.style('left', (e.clientX + 15) + 'px')
            .style('top', e.clientY + 'px')
            .transition()
            .style('opacity', 0.98)
            // .html("HELLO")
        tip.select('h3').html(`${thisBarData.title}, ${thisBarData.release_year}`);
        tip.select('h4').html(`${thisBarData.tagline}, ${thisBarData.runtime} min.`);
        d3.select('.tip-body').selectAll('p').data(bodyData)
            .join('p').attr('class', 'tip-info')
            .html(d => `${d[0]} : ${d[1]}`)
    }
    function mousemove(e) {
        tip.style('left', (e.clientX + 15) + 'px')
            .style('top', e.clientY + 'px')
            .style('opacity', 0.98)

    }
    function mouseout(e) {
        tip.style('opacity', 0)
        .transition()
    }
    //interactive 新增監聽
    d3.selectAll('.bar')
        .on('mouseover', mouseover)
        .on('mousemove', mousemove)
        .on('mouseout', mouseout);

  
}





//Main
function chooseData(metric, movieClean) {
    const thisData = movieClean.sort((a, b) => b[metric] - a[metric])
        .filter((d, i) => i < 15);
    return thisData;
};

function ready(movies) {
    const movieClean = filterData(movies);
    // console.log(moviesClean);
    const revenueData = chooseData("revenue", movieClean);
    // debugger
    setupCanvas(revenueData, movieClean);
    // const barChartData = prepareBarCharData(moviesClean).sort(
    //     (a, b) => {
    //         return d3.descending(a.revenue, b.revenue);
    //         //descending 降冪處理 d3 幫你處理
    //         //return b.revenue-a.revenue; 降冪處理
    //         // a.revenue-b.revenue 升冪處理
    //     }


    // );
    // console.log(barChartData);
    // setupCanvas(barChartData);
}

//Load Data
d3.csv('movies.csv', type).then(
    res => {
        ready(res);
        //console.log(res);
    }
)