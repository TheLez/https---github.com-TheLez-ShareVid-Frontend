const { addWebpackModuleRule } = require('customize-cra');

       module.exports = {
         webpack: (config) => {
           config.resolve.alias = {
             ...config.resolve.alias,
             '@mediapipe/tasks-vision': require.resolve('@mediapipe/tasks-vision'),
           };
           config.module.rules.push({
             test: /\.wasm$/,
             type: 'asset/resource',
           });
           return config;
         },
       };