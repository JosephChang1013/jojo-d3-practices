const friends = {
    john:['Apple','Orange','Lemon'],
    marry:['Apple','Orange'],
    joseph:['Apple','Cherry','Orange','Peach']
};

const thisSVG = d3.select('svg');
const selectbutton = d3.select(  )
// d3.selectAll('button').on('click',click);
d3.selectAll('body').on('keydown',key);
// 點擊後呼叫 function friends內的data 
// function click(){
//     const thisFruitList = friends[this.dataset.name];
//     update(thisFruitList);

// }
function key() {
    

}
// update function 內的join 三種情形:
// enter => 進入要做的事件
// update => 更新之後不一樣的事件 
// exit => 消失的東西做得事件
function update(data){
    thisSVG.selectAll('text')
    .data(data,d=>d)
    .join(
        enter =>{
            enter.append('text').text(d=>d)
                    // ('x',-100)從畫面左邊進入
                    // y 每筆資料進來之後 在上一筆的下面一點(50+i*30)
                 .attr('x',-100).attr('y',(d,i)=>50+i*30)
                 .style('fill','green')
                 .transition().attr('x',30)
        },
        // ('y',(d,i)=>50+i*30) 重新計算 更新的元素 位置的落位
        update => {
            update.transition()
                  .style('fill','red').attr('y',(d,i)=>50+i*30)
        },
        exit =>{
            exit.transition()
                .attr('x',150)
                .style('fill','yellow').remove()
        }
    )
}