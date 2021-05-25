const Backend = artifacts.require('Backend');
const truffleAssert = require('truffle-assertions');


// add / delete / activate / deactivate delegates
contract('Backend', (accounts) => {
    let backend = null;
    before( async () => {
        backend = await Backend.deployed();
    });

    // addDelegate
    it('Owner can add delegates', async () => {
        await backend.addDelegate(accounts[1] , {from: accounts[0]});
        await backend.addDelegate(accounts[2] , {from: accounts[0]});
        await backend.addDelegate(accounts[3] , {from: accounts[0]});
    });

    it('Fail when somebody except owner trys to add new delegate', async () => {
        await truffleAssert.reverts(backend.addDelegate(accounts[2] , {from: accounts[1]}));
        await truffleAssert.reverts(backend.addDelegate(accounts[5] , {from: accounts[4]}));
    });
    
    // deleteDelegate
    it('Owner can delete delegate', async () => {
        await backend.deleteDelegate(accounts[3], {from : accounts[0]});
    });

    it('Owner cant delete delegate when delegate does not exist', async () => {
        await truffleAssert.reverts(backend.deleteDelegate(accounts[3], {from : accounts[0]}));
    });

    it('Delegate cant delete other delegate', async () => {
        await truffleAssert.reverts(backend.deleteDelegate(accounts[2], {from : accounts[1]}));
    });

    // dactivate / activate delegate
    it('Owner can deactivate delegate', async () => {
        await backend.deactivateDelegate(accounts[2], {from : accounts[0]});
    });

    it('Owner can activate delegate', async () => {
        await backend.activateDelegate(accounts[2], {from : accounts[0]});
    });

    it('delegate cant deactivate other delegate', async () => {
        await truffleAssert.reverts(backend.deactivateDelegate(accounts[2], {from : accounts[1]}));
    });

    it('delegate cant activate other delegate', async () => {
        await truffleAssert.reverts(backend.deactivateDelegate(accounts[2], {from : accounts[1]}));
    });
});

// add / delete doctors
contract('Backend', (accounts) => {
    let backend = null;
    before( async () => {
        backend = await Backend.deployed();
        await backend.addDelegate(accounts[1] , {from: accounts[0]});
        await backend.addDelegate(accounts[2] , {from: accounts[0]});
        await backend.addDelegate(accounts[3] , {from: accounts[0]});
    });

    // add/remove doctor
    it('Owner cant add doctor', async () => {
        await truffleAssert.reverts(backend.addDoctor(accounts[4], {from : accounts[0]}));
    });

    it('Delegate can add doctor', async () => {
        await backend.addDoctor(accounts[4], {from : accounts[1]});
    });

    it('Delegate can remove doctor', async () => {
        await backend.deleteDoctor(accounts[4], {from : accounts[1]});
        await backend.addDoctor(accounts[4], {from : accounts[1]});
    });

    it('Owner cant remove doctor', async () => {
        await truffleAssert.reverts(backend.deleteDoctor(accounts[4], {from : accounts[0]}));
    });

    it('Deactivated delegate cant add doctor', async () => {
        await backend.deactivateDelegate(accounts[1], { from :accounts[0]});
        await truffleAssert.reverts(backend.addDoctor(accounts[5], {from : accounts[1]}));
        await backend.activateDelegate(accounts[1], { from :accounts[0]});
    });

    it('A doctor cant be added twice', async () => {
        await backend.addDoctor(accounts[5], {from : accounts[1]});
        await truffleAssert.reverts(backend.addDoctor(accounts[5], {from : accounts[1]}));
    });

    /*
        account[0] : owner
        account[1] : delegate
        account[2] : delegate
        account[3] : delegate
        account[4] : doctor
        account[5] : doctor
    */

    it('Doctor cant add other doctor', async () => {
        await truffleAssert.reverts(backend.addDoctor(accounts[6], {from : accounts[4]}));
    });

    it('Doctor cant delete other doctor', async () => {
        await truffleAssert.reverts(backend.deleteDoctor(accounts[6], {from : accounts[4]}));
    });
});

// activate / deactivate doctor
contract('Backend', (accounts) => {
    let backend = null;
    before( async () => {
        backend = await Backend.deployed();
        await backend.addDelegate(accounts[1] , {from: accounts[0]});
        await backend.addDelegate(accounts[2] , {from: accounts[0]});
        await backend.addDelegate(accounts[3] , {from: accounts[0]});
        await backend.addDoctor(accounts[4], {from : accounts[1]});
        await backend.addDoctor(accounts[5], {from : accounts[1]});
    });

    /*
        account[0] : owner
        account[1] : delegate
        account[2] : delegate
        account[3] : delegate
        account[4] : doctor
        account[5] : doctor
    */

    it('Owner cant deactivate doctor', async () => {
        await truffleAssert.reverts(backend.deactivateDoctor(accounts[4], 1500, 1700, {from : accounts[0]}));
    });

    it('Owner cant activate doctor', async () => {
        await truffleAssert.reverts(backend.activateDoctor(accounts[4], 1500, 1700, {from : accounts[0]}));
    });

    it('Delegate can activate other doctor', async () => {
        await backend.deactivateDoctor(accounts[4], 1500, 1700, {from : accounts[3]});
    });

    it('Delegate can activate other doctor', async () => {
        await backend.activateDoctor(accounts[4], 1500, 1700, {from : accounts[3]});
    });

    it('Doctor cant deactivate other doctor', async () => {
        await truffleAssert.reverts(backend.deactivateDoctor(accounts[4], 1500, 1700, {from : accounts[5]}));
    });

    it('Doctor cant activate other doctor', async () => {
        await truffleAssert.reverts(backend.activateDoctor(accounts[4], 1500, 1700, {from : accounts[5]}));
    });
});
