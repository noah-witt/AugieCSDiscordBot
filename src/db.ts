import * as mongoose from 'mongoose';
mongoose.connect(process.env.MONGO, {useNewUrlParser: true, useUnifiedTopology: true});
import * as models from './models';