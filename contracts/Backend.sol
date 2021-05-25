// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

struct delegate {
    bool exists;
    bool active;
    // keeps track of all doctors which have been added by this delegate
    address[] addedKeys;
}

struct doctor {
    bool exists;
    address creator;
    
    // kepps track of intervalls in which doctor is not allowed to sign
    // new certificates
    uint[][] inactive;
}

contract Backend {
    
    address owner;
    
    // mapping for delegates
    mapping(address => delegate) delegates;
    
    // mapping for doctors
    mapping(address => doctor) doctors;
    
    constructor() {
        owner = msg.sender;
    }
    
    uint MAX_INT = type(uint).max;
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not Authorized : You are not the owner");
        _;
    }
    
    modifier delegateDoesExist(address _id) {
        require(delegates[_id].exists, "Delegate does not exists");
        _;
    }
    
    modifier delegateDoesNotExist(address _id) {
        require(!delegates[_id].exists, "Delegate already exists");
        _;
    }
    
    modifier delegateIsActive(address _id) {
        require(delegates[_id].active, "Delegate Does not exist or inactive");
        _;
    }
    
    modifier doctorDoesExist(address _id) {
        require(doctors[_id].exists, "Doctor does not exists");
        _;
    }
    
    modifier doctorDoesNotExist(address _id) {
        require(!doctors[_id].exists, "Doctor does already exists");
        _;
    }
    
    // Adding new delegate
    function addDelegate(address _id) public onlyOwner delegateDoesNotExist(_id) {
        delegates[_id] = delegate(true, true, new address[](0));
    }
    
    // delete delegate
    function deleteDelegate(address _id) public onlyOwner delegateDoesExist(_id) {
        delete delegates[_id];
    }
    
    // deactivate delegate so that he cant add new doctors
    function deactivateDelegate(address _id) public onlyOwner delegateDoesExist(_id) {
        delegates[_id].active = false;
    }
    
    // activate delegate so that he can add new doctors
    function activateDelegate(address _id) public onlyOwner delegateDoesExist(_id) {
        delegates[_id].active = true;
    }
    
    // check if a key exists in the addedKeys of a delegate
    function checkIfKeyInAddedkeys(address _key, address _delegate) private view returns(uint){
        for (uint i = 0; i < delegates[_delegate].addedKeys.length; i++) {
            if (delegates[_delegate].addedKeys[i] == _key) {
                return i + 1;
            }
        }
        
        return 0;
    }
    
    // delete key from addedKeys of delegates
    function deleteKeyFromAddedKeys(address _key, address _delegate) private {
        uint i = checkIfKeyInAddedkeys(_key, _delegate);
        uint len = delegates[_delegate].addedKeys.length;
        
        if (i > 0) {
            // if the key is the last element of array just delete
            if (i == len) {
                delegates[_delegate].addedKeys.pop();
                return;
            }
            // otherwise write the last element of the array
            // to the spot of the element which will get deleted
            // and delete the last element of array
            delegates[_delegate].addedKeys[i - 1] = delegates[_delegate].addedKeys[len - 1];
            delegates[_delegate].addedKeys.pop();
        }
    }
    
    // doctor ####################################################################
    
    // add new doctor
    function addDoctor(address _id) public delegateIsActive(msg.sender) doctorDoesNotExist(_id) {
        uint[][] memory p;
        
        doctors[_id] = doctor(true, msg.sender, p);
        
        deactivateDoctor(_id, 1, block.number);
        
        delegates[msg.sender].addedKeys.push(_id);
    }

    // delete doctor        
    function deleteDoctor(address _id) public delegateIsActive(msg.sender) {
        require(doctors[_id].exists, "Gotcha");
        delete doctors[_id];
        deleteKeyFromAddedKeys(_id, msg.sender);
    }
    
    // deactivate doctor for a specific timeframe
    function deactivateDoctor(address _id, uint _begin, uint _end) public delegateIsActive(msg.sender) doctorDoesExist(_id) {
        require(_begin <= _end || _end == 0, "Invalid intervall _begin needs to be smaller or equal to _end");
        require(_begin > 0, "Earlyiest timepoint is block number 1");
        
        // if nothing is in list yet just add
        if (doctors[_id].inactive.length == 0) {
            doctors[_id].inactive.push([_begin, _end]);
            return;
        }
        
        uint[][] memory p = doctors[_id].inactive;
        
        bool update = false;
        uint _endCopy = _end;
        
        if (_end == 0) {_end = MAX_INT;}
        
        for (uint i = 0; i < p.length; i++) {
            uint begin = p[i][0];
            uint end = p[i][1];
            
            if (end == 0) {end = MAX_INT;}
            
            if (end != MAX_INT && _begin == end + 1) {
                doctors[_id].inactive[i][1] = _end == MAX_INT ? 0 : _endCopy;
                return;
            }
            
            if (_end == begin - 1) {
                doctors[_id].inactive[i][0] = _begin;
                return;
            }
            
            if (checkIfInIntervall(_begin, begin, end)) {
                if (end < _end) {
                    doctors[_id].inactive[i][1] = _end == MAX_INT ? 0 : _end;
                    update = true;
                    return;
                }
                update = true;
            } else if (checkIfInIntervall(_end, begin, end)) {
                if (_begin < begin) {
                    doctors[_id].inactive[i][0] = _begin;
                    update = true;
                    return;
                }
                update = true;
            } else if (_begin < begin && end < _end) {
                doctors[_id].inactive[i][0] = _begin;
                doctors[_id].inactive[i][1] = _end == MAX_INT ? 0 : _end;
                update = true;
                return;
            }
        }
        
        if (!update) {
            doctors[_id].inactive.push([_begin, _end == MAX_INT ? 0 : _end]);
        }
    }
    
    // activate doctor for a specific timeframe
    function activateDoctor(address _id, uint _begin, uint _end) public delegateIsActive(msg.sender) doctorDoesExist(_id) {
        require(_begin <= _end || _end == 0, "Invalid intervall _begin needs to be smaller or equal to _end");
        
        // if nothing is in list yet just do nothing
        if (doctors[_id].inactive.length == 0) {
            return;
        }
        
        if (_begin == 1 && _end == 0) {
            delete doctors[_id].inactive;
        }
        
        uint[][] memory p = doctors[_id].inactive;
        uint length = p.length;
        uint _endCopy = _end;
        
        if (_end == 0) {_end = MAX_INT;}
        
        for (uint i = 0; i < length; i++) {
            uint begin = p[i][0];
            uint end   = p[i][1];
            
            if (end == 0) {end = MAX_INT;}
            
            if (begin > _end || _begin > end) {
                continue;
            }

            if ((begin == end) && (begin == _begin || begin == _end)) {
                doctors[_id].inactive[i] = doctors[_id].inactive[length - 1];
                doctors[_id].inactive.pop();
                length--;
                if (i > 0) { i--;}
                continue;
            }
            
            if (checkIfInIntervall(_begin, begin, end) && !checkIfInIntervall(_end, begin, end)) {
                if (_begin <= begin) {
                    doctors[_id].inactive[i] = doctors[_id].inactive[length - 1];
                    doctors[_id].inactive.pop();
                    length--; 
                    if (i > 0) { i--;}
                    continue;
                }
                doctors[_id].inactive[i][1] = _begin - 1;
                continue;
            }
            
            if (!checkIfInIntervall(_begin, begin, end) && checkIfInIntervall(_end, begin, end)) {
                if (_end >= end) {
                    doctors[_id].inactive[i] = doctors[_id].inactive[length - 1];
                    doctors[_id].inactive.pop();
                    length--;
                    if (i > 0) { i--;}
                    continue;
                }
                doctors[_id].inactive[i][1] = _end - 1;
                continue;
            }
            
            if (checkIfInIntervall(_begin, begin, end) && checkIfInIntervall(_end, begin, end)) {
                
                if (_begin <= begin && _end >= end) {
                    doctors[_id].inactive[i] = doctors[_id].inactive[length - 1];
                    doctors[_id].inactive.pop();
                    length--;
                    if (i > 0) { i--;}
                    continue;
                }
                
                if (_begin == begin) {
                    if (_end == MAX_INT) {
                        doctors[_id].inactive[i] = doctors[_id].inactive[length - 1];
                        doctors[_id].inactive.pop();
                        length--;
                        if (i > 0) { i--;}
                        continue;     
                    }
                    doctors[_id].inactive[i][0] = _end + 1;
                    continue;
                }
                
                if (_end == end) {
                    doctors[_id].inactive[i][1] = _begin - 1;
                    continue;
                }
                
                doctors[_id].inactive[i][1] = _begin - 1;
                
                if (_end != MAX_INT) {
                    deactivateDoctor(_id, _endCopy + 1 , end == MAX_INT ? 0 : p[i][1]);   
                }
            } 
            
        }
    }
    
    // checkcerticate main function of contract #####################################
    function checkCertificate(address _id, uint _block) external view doctorDoesExist(_id) returns(bool) {
        uint[][] memory p = doctors[_id].inactive;
        
        for (uint i = 0; i < p.length; i++) {
            if (p[i][1] == 0 && p[i][0] <= _block) {
                return false;
            }
            if (p[i][0] <= _block && _block <= p[i][1]) {
                return false;
            }
        }
        
        return true;
    }
    
    // help functions ################################################################
    function checkIfInIntervall(uint _toCheck, uint _begin, uint _end) private pure returns(bool) {
        return ((_begin <= _toCheck && _toCheck <= _end));
    }
}
