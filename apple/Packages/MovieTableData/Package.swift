// swift-tools-version: 6.2
import PackageDescription

let package = Package(
    name: "MovieTableData",
    platforms: [
        .iOS(.v26),
        .macOS(.v26),
    ],
    products: [
        .library(name: "MovieTableData", targets: ["MovieTableData"]),
    ],
    dependencies: [
        .package(path: "../MovieTableCore"),
        .package(url: "https://github.com/supabase-community/supabase-swift.git", from: "2.5.1"),
    ],
    targets: [
        .target(
            name: "MovieTableData",
            dependencies: [
                .product(name: "MovieTableCore", package: "MovieTableCore"),
                .product(name: "Supabase", package: "supabase-swift"),
            ],
        ),
        .testTarget(
            name: "MovieTableDataTests",
            dependencies: [
                "MovieTableData",
                .product(name: "MovieTableCore", package: "MovieTableCore"),
            ],
        ),
    ]
)
