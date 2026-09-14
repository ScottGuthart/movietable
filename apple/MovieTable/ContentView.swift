//
//  ContentView.swift
//  MovieTable
//
//  Created by Scott on 9/14/2026.
//

import SwiftUI

struct ContentView: View {
    var body: some View {
        VStack(spacing: 24) {
            HStack(spacing: 0) {
                Text("MovieTable")
                    .foregroundStyle(.ink)
                Text(".")
                    .foregroundStyle(.marqueeCrimson)
            }
            .font(.custom("Playfair Display", size: 36, relativeTo: .title))
            .fontWeight(.semibold)
            .kerning(-0.9)

            Rectangle()
                .fill(.hairline)
                .frame(height: 1)

            HStack(spacing: 12) {
                Text("Final Score")
                    .font(.custom("Playfair Display", size: 13, relativeTo: .caption))
                    .foregroundStyle(.fadedInk)
                Text("95")
                    .font(.custom("Playfair Display", size: 15, relativeTo: .footnote))
                    .fontWeight(.semibold)
                    .monospacedDigit()
                    .foregroundStyle(.marqueeCrimson)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color.marqueeCrimson.opacity(0.1))
            }
        }
        .padding(24)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.paper)
    }
}

#Preview {
    ContentView()
}
