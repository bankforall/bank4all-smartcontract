pragma solidity ^0.8.0;

contract Transfer {
    event TransferCompleted(address indexed _from, address indexed _to, uint256 _value);

    function transferTHB(address _from, address _to, uint256 _value) public returns (bool) {
        require(_from != address(0), "Invalid sender address");
        require(_to != address(0), "Invalid recipient address");
        require(_value > 0, "Invalid transfer amount");

        emit TransferCompleted(_from, _to, _value);
        return true;
    }
}
