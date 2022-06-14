// d3.csv('https://raw.githubusercontent.com/ryanchung403/dataset/main/Housing_Dataset_Sample.csv').then(
//     res =>{
//         console.log('online CSV:',res);
//         debugger;
//     }

// )
// d3.json('https://api.chucknorris.io/jokes/random').then(
//     res =>{
//         console.log('online JSON:',res);
//         debugger;
//     }

// )

const potter = d3.json('harry_potter.json');
const rings = d3.csv('lord_of_the_rings.csv');

Promise.all([potter,rings]).then(
    res =>{
        //debugger;
        let combineArray=[...res[0],...res[1]];
        debugger;
    }
);