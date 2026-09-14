// swift-tools-version: 6.2
import PackageDescription

let package = Package(
    name: "MovieTableCore",
    platforms: [
        .iOS(.v26),
        .macOS(.v26),
    ],
    products: [
        .library(name: "MovieTableCore", targets: ["MovieTableCore"]),
    ],
    targets: [
        .target(
            name: "MovieTableCore",
        ),
        .testTarget(
            name: "MovieTableCoreTests",
            dependencies: ["MovieTableCore"],
        ),
    ]
)
