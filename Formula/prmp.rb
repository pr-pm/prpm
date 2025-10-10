class Prmp < Formula
  desc "Prompt Package Manager - Install and manage prompt-based files like Cursor rules and Claude sub-agents"
  homepage "https://github.com/khaliqgant/prompt-package-manager"
  url "https://github.com/khaliqgant/prompt-package-manager/releases/download/v0.1.0/prmp-macos-x64"
  sha256 "your-sha256-hash-here"
  version "0.1.0"
  license "MIT"
  
  # Support both Intel and Apple Silicon Macs
  if Hardware::CPU.arm?
    url "https://github.com/khaliqgant/prompt-package-manager/releases/download/v0.1.0/prmp-macos-arm64"
    sha256 "your-arm64-sha256-hash-here"
  end
  
  def install
    if Hardware::CPU.arm?
      bin.install "prmp-macos-arm64" => "prmp"
    else
      bin.install "prmp-macos-x64" => "prmp"
    end
  end
  
  test do
    system "#{bin}/prmp", "--version"
  end
end
