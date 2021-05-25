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

// checkcertificate
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

    it('Activate Doctor from Block 1 to forever', async () => {
        await backend.activateDoctor(accounts[4], 1, 0, {from: accounts[1]});
        var res = await backend.checkCertificate(accounts[4], 10);
        assert.equal(true, res, "Doctor should be activated from block 1 to forever");

        var res = await backend.checkCertificate(accounts[4], 1);
        assert.equal(true, res, "Doctor should be activated from block 1 to forever");

        var res = await backend.checkCertificate(accounts[4], 1000);
        assert.equal(true, res, "Doctor should be activated from block 1 to forever");
    });

    // if a doctor does not exist revert
    it('Revert check if doctor does not exist', async () => {
        await truffleAssert.reverts(backend.checkCertificate(accounts[6], 0, {from : accounts[7]}));
    });

    // two seperate intervalls
    it('Seperate deactivate intervalls should work properly', async () => {
        // deactive doctor from block 15k to 17k
        await backend.deactivateDoctor(accounts[4], 150, 170, {from : accounts[1]});
        //dactivate doctor from block 30k to 35k
        await backend.deactivateDoctor(accounts[4], 300, 350, {from : accounts[1]});
        

        assert.equal(await backend.checkCertificate(accounts[4], 1), true);
        assert.equal(await backend.checkCertificate(accounts[4], 2), true);
        assert.equal(await backend.checkCertificate(accounts[4], 149), true);
        assert.equal(await backend.checkCertificate(accounts[4], 150), false);
        assert.equal(await backend.checkCertificate(accounts[4], 151), false);
        assert.equal(await backend.checkCertificate(accounts[4], 152), false);
        assert.equal(await backend.checkCertificate(accounts[4], 170), false);
        assert.equal(await backend.checkCertificate(accounts[4], 171), true);
        assert.equal(await backend.checkCertificate(accounts[4], 172), true);
        assert.equal(await backend.checkCertificate(accounts[4], 299), true);
        assert.equal(await backend.checkCertificate(accounts[4], 300), false);
        assert.equal(await backend.checkCertificate(accounts[4], 301), false);
        assert.equal(await backend.checkCertificate(accounts[4], 350), false);
        assert.equal(await backend.checkCertificate(accounts[4], 351), true);

        await backend.activateDoctor(accounts[4], 1, 0, {from : accounts[1]});
    });

    // infinite intervalls
    it('Infinite deactivate intervalls should work properly', async () => {
        // deactive doctor from block 150
        await backend.activateDoctor(accounts[5], 1, 0, {from : accounts[1]});
        await backend.deactivateDoctor(accounts[5], 150, 0, {from : accounts[1]});
        
        assert.equal(await backend.checkCertificate(accounts[5], 1), true);
        assert.equal(await backend.checkCertificate(accounts[5], 2), true);
        assert.equal(await backend.checkCertificate(accounts[5], 149), true);
        assert.equal(await backend.checkCertificate(accounts[5], 150), false);
        assert.equal(await backend.checkCertificate(accounts[5], 151), false);
    });

    // updating infinite intervall
    it('Update deactivate intervalls should work properly', async () => {
        await backend.deactivateDoctor(accounts[5], 130, 0, {from : accounts[1]});
        
        assert.equal(await backend.checkCertificate(accounts[5], 1), true);
        assert.equal(await backend.checkCertificate(accounts[5], 2), true);
        assert.equal(await backend.checkCertificate(accounts[5], 129), true);
        assert.equal(await backend.checkCertificate(accounts[5], 130), false);
        assert.equal(await backend.checkCertificate(accounts[5], 150), false);
        assert.equal(await backend.checkCertificate(accounts[5], 150000), false);

        await backend.activateDoctor(accounts[5], 151, 0, {from : accounts[1]});

        assert.equal(await backend.checkCertificate(accounts[5], 1), true);
        assert.equal(await backend.checkCertificate(accounts[5], 2), true);
        assert.equal(await backend.checkCertificate(accounts[5], 129), true);
        assert.equal(await backend.checkCertificate(accounts[5], 130), false);
        assert.equal(await backend.checkCertificate(accounts[5], 131), false);
        assert.equal(await backend.checkCertificate(accounts[5], 149), false);
        assert.equal(await backend.checkCertificate(accounts[5], 150), false);
        assert.equal(await backend.checkCertificate(accounts[5], 150000), true);

        await backend.activateDoctor(accounts[5], 1, 0, {from : accounts[1]});

        await backend.deactivateDoctor(accounts[5], 500, 0, {from : accounts[1]});
        await backend.activateDoctor(accounts[5], 500, 0, {from : accounts[1]});
        assert.equal(await backend.checkCertificate(accounts[5], 499), true);
        assert.equal(await backend.checkCertificate(accounts[5], 500), true);
        assert.equal(await backend.checkCertificate(accounts[5], 501), true);
        assert.equal(await backend.checkCertificate(accounts[5], 150000), true);
    });
});
