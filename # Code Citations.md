# Code Citations

## License: MIT
https://github.com/phemonick/eventmanagement1/blob/b05e4455b448c0f02fec3b35a62da3fad289f943/server/models/user.js

```
{ DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM
```


## License: unknown
https://github.com/LauroFranco/Projeto-integrador/blob/fc07570564eb55a995f7a55ba5bbb2c02c47de61/DH_SafetyVan/models/User.js

```
{ DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM
```


## License: unknown
https://github.com/akshay2739/E-commerce/blob/a4a2281f610685f4e868746bd400746e844bb144/back-end/models/UserModel.js

```
{ DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM
```


## License: unknown
https://github.com/FernandoRuizParietti/Backend-Challenge-Alkemy-/blob/41dd48b4cf7b0df4a7f1642093f0ab0dcff39dcc/src/models/User.js

```
{ DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM
```


## License: unknown
https://github.com/asafedainez/comcad-back/blob/f8cd355d7a3d27c58b2ec572da4e72d14bdcb7d8/src/database/models/user.model.js

```
{ DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM
```


## License: MIT
https://github.com/web-senpai/tech-blog/blob/9723f37174f6f5589e19a44c33b709c85e7d18a2/posts/sequelize-orm-rest-api.md

```
{ DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM
```


## License: unknown
https://github.com/Nura21/vehicle-rest-api/blob/2e153a78014c81452fdc054b9b85ca9e3e2f98ca/models/User.js

```
{ DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM
```


## License: unknown
https://github.com/gljacobs/simple-login/blob/ef4d003101fa6e2a54302661d5714e5b621c8ea3/database/models/Users.js

```
{ DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM
```


## License: unknown
https://github.com/dsvivass/EXPRESS-js-CC/blob/1773f5bb111e8e24426e9dac28d2e9a09ed12e41/src/models/User.js

```
{ DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM
```


## License: unknown
https://github.com/mayaelabed/Reservation/blob/00e579621480c42f61a7121c7998a2e5f8aba59f/routes/authRoutes.js

```
');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword, role
```


## License: unknown
https://github.com/Ornou/Nodejs_MOO_D/blob/bcdd161480f792edee3fa4192e419d2ddb373610/route/user.js

```
');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword, role
```


## License: unknown
https://github.com/sharma242000/my-app-server/blob/ea51b6ba3960f3d5810434245f7d9a92262dd268/routes/auth.js

```
');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword, role
```


## License: MIT
https://github.com/dreamistlabs/dlabs-cli/blob/a2aa430a877bc8605fe7b71ee8e8f32db3288b23/test/dlabs-cli.test.js

```
"0.1.0",
  "private": true,
  "dependencies": {
    "@testing-library/jest-dom": "^5.16.4",
    "@testing-library/react": "^13.3.0",
    "@testing-library/user-event": "^13.5.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1",
    "web-vitals": "^2.1.4"
```


## License: unknown
https://github.com/PoSungKim/development_study/blob/feb409986f39e92147839179cc9dc01ba4ec1ce9/React/02.%ED%99%98%EA%B2%BD%EC%84%B8%ED%8C%85%20%28CRA%29.md

```
"0.1.0",
  "private": true,
  "dependencies": {
    "@testing-library/jest-dom": "^5.16.4",
    "@testing-library/react": "^13.3.0",
    "@testing-library/user-event": "^13.5.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1",
    "web-vitals": "^2.1.4"
```


## License: unknown
https://github.com/20-UR-0010/Software-Design-Lab-Exercises/blob/b9656db802a8e07b773b33a2d0674b9838490d1b/SOFTWARE%20DESIGN-2-B-CARINO%2CKEISHAN_LABREPORT%237

```
"0.1.0",
  "private": true,
  "dependencies": {
    "@testing-library/jest-dom": "^5.16.4",
    "@testing-library/react": "^13.3.0",
    "@testing-library/user-event": "^13.5.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1",
    "web-vitals": "^2.1.4"
```

