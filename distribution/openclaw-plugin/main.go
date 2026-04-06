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

	fmt.Println("Shopflow OpenClaw public fallback scaffold")
	fmt.Println("This is a publicly installable fallback, not an official OpenClaw listing.")
	fmt.Println("Install through OpenClaw customPlugins using a public GitHub repo source.")
	fmt.Printf("Reference packet directory: %s\n", packetRoot)
	fmt.Println("Key files:")
	fmt.Printf("- %s/agent-target-packet.openclaw.json\n", packetRoot)
	fmt.Printf("- %s/plugin-marketplace-metadata.openclaw.json\n", packetRoot)
	fmt.Println("- ./install.snippet.nix")
}
