#include <chrono>
#include <functional>
#include <iomanip>
#include <iostream>
#include <sstream>
#include <string>

std::string hex_hash(const std::string& input) {
  std::size_t value = std::hash<std::string>{}(input);
  std::ostringstream out;
  out << std::hex << value;
  return out.str();
}

int main(int argc, char* argv[]) {
  if (argc < 3) {
    std::cerr << "usage: speakset_native <token|message_id> <value...>\n";
    return 1;
  }

  const std::string command = argv[1];
  const auto now = std::chrono::system_clock::now();
  const auto millis = std::chrono::duration_cast<std::chrono::milliseconds>(
                          now.time_since_epoch())
                          .count();

  if (command == "token") {
    const std::string username = argv[2];
    const std::string digest = hex_hash(username + ":" + std::to_string(millis));
    std::cout << "speakset." << digest << ".native";
    return 0;
  }

  if (command == "message_id") {
    std::ostringstream joined;
    for (int i = 2; i < argc; ++i) {
      if (i > 2) joined << ':';
      joined << argv[i];
    }
    const std::string digest = hex_hash(joined.str() + ":" + std::to_string(millis));
    std::cout << "msg_" << digest;
    return 0;
  }

  std::cerr << "unknown command: " << command << "\n";
  return 1;
}
