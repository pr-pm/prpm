class Prmp < Formula
  desc "Prompt Package Manager - Install and manage prompt-based files like Cursor rules and Claude sub-agents"
  homepage "https://github.com/khaliqgant/prompt-package-manager"
  url "https://github.com/khaliqgant/prompt-package-manager/releases/download/v0.1.2/prmp-macos-x64"
  sha256 "a0034225ebe8f6e507ee97a7d11c5dbe0c9e46bbe5334b97640344b506a4ad79"
  version "0.1.2"
  license "MIT"
  
  # Support both Intel and Apple Silicon Macs
  if Hardware::CPU.arm?
    url "https://github.com/khaliqgant/prompt-package-manager/releases/download/v0.1.2/prmp-macos-arm64"
    sha256 "7aebcca6d1ccf3694f4117647a92f7443c2c77d01256b5a16472d07af95104b8"
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
