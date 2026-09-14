// swift-tools-version: 6.2
import PackageDescription

let package = Package(
    name: "MovieTableUI",
    platforms: [
        .iOS(.v26),
        .macOS(.v26),
    ],
    products: [
        .library(name: "MovieTableUI", targets: ["MovieTableUI"]),
    ],
    dependencies: [
        .package(path: "../MovieTableCore"),
        .package(path: "../MovieTableData"),
    ],
    targets: [
        .target(
            name: "MovieTableUI",
            dependencies: [
                .product(name: "MovieTableCore", package: "MovieTableCore"),
                .product(name: "MovieTableData", package: "MovieTableData"),
            ],
        ),
        .testTarget(
            name: "MovieTableViewTests",
            dependencies: ["MovieTableUI"],
        ),
    ]
)
