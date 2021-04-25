let fs = require('fs');
let cp = require('child_process');
let isBuilding = false;

function build() {
  if (isBuilding) return;
  isBuilding = true;
  const date = new Date();
  console.log(`${date.getHours()}:${date.getMinutes()}:${date.getSeconds()} Building...`);
  cp.exec('npm run build', err => {
    if (err) return console.log(err);
    console.log('DONE!');
  });
  setTimeout(() => {
    isBuilding = false;
  }, 1000);
}

fs.watch('./src/', (evt, fileName) => {
  build();
});
fs.watch('./src/components/', (evt, fileName) => {
  build();
});
fs.watch('./src/store/', (evt, fileName) => {
  build();
});
