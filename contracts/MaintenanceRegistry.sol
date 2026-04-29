// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title MaintenanceRegistry
/// @notice On-chain registry of maintenance report fingerprints (SHA-256 hashes).
/// @dev File asli tidak pernah disimpan on-chain — hanya hash + metadata ringan.
contract MaintenanceRegistry {
    struct MaintenanceRecord {
        bytes32 fileHash;
        string equipmentCode;
        string maintenanceType;
        string note;
        uint256 registeredAt;
        address registeredBy;
    }

    mapping(bytes32 => MaintenanceRecord) public records;
    bytes32[] public allHashes;

    event RecordRegistered(
        bytes32 indexed fileHash,
        string equipmentCode,
        string maintenanceType,
        address indexed registeredBy,
        uint256 registeredAt
    );

    error DuplicateHash(bytes32 fileHash);
    error EmptyHash();

    function registerRecord(
        bytes32 fileHash,
        string calldata equipmentCode,
        string calldata maintenanceType,
        string calldata note
    ) external {
        if (fileHash == bytes32(0)) revert EmptyHash();
        if (records[fileHash].registeredAt != 0) revert DuplicateHash(fileHash);

        records[fileHash] = MaintenanceRecord({
            fileHash: fileHash,
            equipmentCode: equipmentCode,
            maintenanceType: maintenanceType,
            note: note,
            registeredAt: block.timestamp,
            registeredBy: msg.sender
        });
        allHashes.push(fileHash);

        emit RecordRegistered(fileHash, equipmentCode, maintenanceType, msg.sender, block.timestamp);
    }

    function verifyRecord(bytes32 fileHash)
        external
        view
        returns (
            bool exists,
            string memory equipmentCode,
            string memory maintenanceType,
            string memory note,
            uint256 registeredAt,
            address registeredBy
        )
    {
        MaintenanceRecord storage r = records[fileHash];
        exists = r.registeredAt != 0;
        equipmentCode = r.equipmentCode;
        maintenanceType = r.maintenanceType;
        note = r.note;
        registeredAt = r.registeredAt;
        registeredBy = r.registeredBy;
    }

    function getAllHashes() external view returns (bytes32[] memory) {
        return allHashes;
    }

    function totalRecords() external view returns (uint256) {
        return allHashes.length;
    }
}
