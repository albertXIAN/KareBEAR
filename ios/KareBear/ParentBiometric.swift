import CryptoKit
import Foundation
import Security

enum AccountPassword {
    static func record(for password: String) -> String {
        var salt = Data(count: 16)
        salt.withUnsafeMutableBytes { buffer in
            _ = SecRandomCopyBytes(kSecRandomDefault, 16, buffer.baseAddress!)
        }
        let digest = hash(password, salt: salt)
        return salt.base64EncodedString() + ":" + digest.base64EncodedString()
    }

    static func matches(_ password: String, record: String) -> Bool {
        let parts = record.split(separator: ":", maxSplits: 1).map(String.init)
        guard parts.count == 2,
              let salt = Data(base64Encoded: parts[0]),
              let expected = Data(base64Encoded: parts[1]) else { return false }
        return hash(password, salt: salt) == expected
    }

    private static func hash(_ password: String, salt: Data) -> Data {
        var data = salt
        data.append(contentsOf: Data(password.utf8))
        return Data(SHA256.hash(data: data))
    }
}
