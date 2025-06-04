import XCTest
import SwiftTreeSitter
import TreeSitterSpectec

final class TreeSitterSpectecTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_spectec())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading SpecTec grammar")
    }
}
