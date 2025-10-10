class Prmp < Formula
  desc "Prompt Package Manager - Install and manage prompt-based files like Cursor rules and Claude sub-agents"
  homepage "https://github.com/khaliqgant/prompt-package-manager"
  url "https://github.com/khaliqgant/prompt-package-manager/releases/download/v0.1.0/prmp-macos-x64"
  sha256 "d062e528207c36847866ed0931a44678e16e83c55f0db27aa1a543458e1df775"
  version "0.1.0"
  license "MIT"
  
  # Support both Intel and Apple Silicon Macs
  if Hardware::CPU.arm?
    url "https://github.com/khaliqgant/prompt-package-manager/releases/download/v0.1.0/prmp-macos-arm64"
    sha256 "6d84a664b24a210042e15a9357e0c859a37712487f6b9c4b5d964aa396908b00"
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
