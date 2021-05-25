const Migrations = artifacts.require("Backend");

module.exports = function (deployer) {
  deployer.deploy(Migrations);
};
