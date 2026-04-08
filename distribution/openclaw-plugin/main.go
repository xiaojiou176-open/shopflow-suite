package main

import (
	"fmt"
	"os"
)

func main() {
	packetRoot := os.Getenv("SHOPFLOW_PACKET_ROOT")
	if packetRoot == "" {
		packetRoot = "./packets"
	}

	fmt.Println("Shopflow OpenClaw fallback shell")
	fmt.Println("This is the OpenClaw-specific fallback install shell, not the canonical Shopflow repo.")
	fmt.Println("Canonical repo: https://github.com/xiaojiou176-open/shopflow-suite")
	fmt.Println("Install through OpenClaw customPlugins using github:xiaojiou176/shopflow-openclaw-plugin.")
	fmt.Printf("Reference packet directory: %s\n", packetRoot)
	fmt.Println("Key files:")
	fmt.Printf("- %s/agent-target-packet.openclaw.json\n", packetRoot)
	fmt.Printf("- %s/plugin-marketplace-metadata.openclaw.json\n", packetRoot)
	fmt.Println("- ./install.snippet.nix")
}
