const Vinduino = artifacts.require("Vinduino");
const Utils = artifacts.require("Utils");

contract('Vinduino', function(accounts) {

   global.authorized_raspberry = accounts[0];
   global.unauthorized_raspberry = accounts[1];

   global.private_key = "0xa6ae07ad556c5f9348cc09c16ed17a437e65acc71e689c1b19f872f1dab3c9c1";

   global.data_vin = [
      {timestamp: "20-3-2018 18:24:08", sensor2: 493, sensor1: 231, sensor05: 234, sensor005: 123, battery: 4.56, temperature: 27.21},
      {timestamp: "20-3-2018 12:44:08", sensor2: 341, sensor1: 567, sensor05: 546, sensor005: 349, battery: 5.11, temperature: 32.43},
      {timestamp: "20-3-2018 23:24:55", sensor2: 764, sensor1: 123, sensor05: 103, sensor005: 565, battery: 4.93, temperature: 17.15},
      {timestamp: "20-2-2018 15:34:32", sensor2: 443, sensor1: 732, sensor05: 654, sensor005: 343, battery: 3.21, temperature: 31.37},
   ];

   before(async function() {

      Vinduino.deployed().then(function(instance) {
         return instance.setRaspberry(global.authorized_raspberry)
      });

      /* Normalize decimals and calculate digital signature */
      for (let i = 0; i < 4; i++) {
         global.data_vin[i].battery = global.data_vin[i].battery * 100
         global.data_vin[i].temperature = global.data_vin[i].temperature * 100
         global.data_vin[i].hash = await Utils.deployed().then(function(instance) {
            return instance.calculate_sha256.call(global.data_vin[i].timestamp, global.data_vin[i].sensor2, global.data_vin[i].sensor1, global.data_vin[i].sensor05, global.data_vin[i].sensor005,
                                             global.data_vin[i].battery, global.data_vin[i].temperature, global.private_key)
         })
      }

   });

   it("data_vin can be inserted by the authorized raspberry using a correct digital signature.", function() {
      return Vinduino.deployed().then(function(instance) {
         return instance.post(global.data_vin[0].timestamp, global.data_vin[0].sensor2, global.data_vin[0].sensor1, global.data_vin[0].sensor05,
                              global.data_vin[0].sensor005, global.data_vin[0].battery, global.data_vin[0].temperature,
                              global.data_vin[0].hash, {from: global.authorized_raspberry})
         })
      })

   it("data_vin can't be inserted by the authorized raspberry using a wrong digital signature.", function() {
         return Vinduino.deployed().then(function(instance) {
            return !instance.post(global.data_vin[1].timestamp, global.data_vin[1].sensor2, global.data_vin[1].sensor1, global.data_vin[1].sensor05, global.data_vin[1].sensor005,
                                  global.data_vin[1].battery, global.data_vin[1].temperature, global.data_vin[0].hash, {from: global.authorized_raspberry})
         })
   })

   it("data_vin can't be inserted by the unauthorized raspberry using a correct digital signature.", function() {
      return Vinduino.deployed().then(function(instance) {
         return !instance.post(global.data_vin[2].timestamp, global.data_vin[2].sensor2, global.data_vin[2].sensor1, global.data_vin[2].sensor05, global.data_vin[2].sensor005,
                               global.data_vin[2].battery, global.data_vin[2].temperature, global.data_vin[2].hash, {from: global.unauthorized_raspberry})
      })
   })

   it("data_vin can't be inserted by the unauthorized raspberry using a wrong digital signature.", function() {
      return Vinduino.deployed().then(function(instance) {
         return !instance.post(global.data_vin[3].timestamp, global.data_vin[3].sensor2, global.data_vin[3].sensor1, global.data_vin[3].sensor05, global.data_vin[3].sensor005,
                               global.data_vin[3].battery, global.data_vin[3].temperature, global.data_vin[0].hash, {from: global.unauthorized_raspberry})
      })
   })

   it("Raspberry authorization can't be modified.", function () {
      return Vinduino.deployed().then(function(instance) {
         return !instance.setRaspberry(global.unauthorized_raspberry, {from: global.authorized_raspberry})
      })
   })



})
