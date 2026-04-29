const bcrypt = require('bcryptjs');
const hash = '$2b$12$/G6Iik/X83iRH42otyLUjOQnxMW/3rXGIwOe7BVeqpsAX1LF2purW';
console.log(bcrypt.compareSync('R-Choice@2025', hash));
