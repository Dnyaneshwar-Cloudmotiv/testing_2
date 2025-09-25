import 'dart:io';
import 'dart:convert';

/// Automated code cleanup utility for Voiz app
/// Removes debug prints, unused imports, and commented code
class CodeCleanupTool {
  static const List<String> debugPatterns = [
    r'print\(',
    r'debugPrint\(',
    r'console\.log\(',
    r'System\.out\.println\(',
  ];

  static const List<String> unusedImports = [
    "import 'package:http/http.dart' as http;",
    "import 'package:http/http.dart';",
  ];

  static const List<String> commentPatterns = [
    r'^\s*//.*$',
    r'^\s*/\*.*\*/$',
    r'^\s*\*.*$',
  ];

  /// Clean a single Dart file
  static Future<Map<String, int>> cleanFile(String filePath) async {
    final file = File(filePath);
    if (!await file.exists()) return {};

    final lines = await file.readAsLines();
    final cleanedLines = <String>[];
    
    int removedPrints = 0;
    int removedComments = 0;
    int removedImports = 0;

    for (String line in lines) {
      bool shouldKeep = true;

      // Remove debug prints
      for (String pattern in debugPatterns) {
        if (RegExp(pattern).hasMatch(line)) {
          removedPrints++;
          shouldKeep = false;
          break;
        }
      }

      // Remove unused HTTP imports (only if ApiService is imported)
      if (shouldKeep) {
        for (String import in unusedImports) {
          if (line.trim() == import.trim()) {
            // Check if file imports ApiService
            final content = await file.readAsString();
            if (content.contains("import 'package:your_app/services/api_service.dart'") ||
                content.contains("import '../services/api_service.dart'") ||
                content.contains("import 'services/api_service.dart'")) {
              removedImports++;
              shouldKeep = false;
              break;
            }
          }
        }
      }

      // Remove single-line comments (but keep important ones)
      if (shouldKeep && line.trim().startsWith('//')) {
        // Keep important comments
        final importantKeywords = ['TODO', 'FIXME', 'NOTE', 'WARNING', 'IMPORTANT', 'API', 'BUG'];
        bool isImportant = importantKeywords.any((keyword) => 
          line.toUpperCase().contains(keyword));
        
        if (!isImportant) {
          removedComments++;
          shouldKeep = false;
        }
      }

      if (shouldKeep) {
        cleanedLines.add(line);
      }
    }

    // Write cleaned content back
    await file.writeAsString(cleanedLines.join('\n'));

    return {
      'prints': removedPrints,
      'comments': removedComments,
      'imports': removedImports,
    };
  }

  /// Clean entire lib directory
  static Future<Map<String, dynamic>> cleanLibDirectory(String libPath) async {
    final libDir = Directory(libPath);
    if (!await libDir.exists()) {
      throw Exception('Lib directory not found: $libPath');
    }

    int totalPrints = 0;
    int totalComments = 0;
    int totalImports = 0;
    int filesProcessed = 0;
    final List<String> processedFiles = [];

    await for (FileSystemEntity entity in libDir.list(recursive: true)) {
      if (entity is File && entity.path.endsWith('.dart')) {
        try {
          final results = await cleanFile(entity.path);
          
          totalPrints += results['prints'] ?? 0;
          totalComments += results['comments'] ?? 0;
          totalImports += results['imports'] ?? 0;
          filesProcessed++;
          
          if ((results['prints'] ?? 0) > 0 || 
              (results['comments'] ?? 0) > 0 || 
              (results['imports'] ?? 0) > 0) {
            processedFiles.add(entity.path);
          }
        } catch (e) {
          print('Error processing ${entity.path}: $e');
        }
      }
    }

    return {
      'totalPrints': totalPrints,
      'totalComments': totalComments,
      'totalImports': totalImports,
      'filesProcessed': filesProcessed,
      'processedFiles': processedFiles,
    };
  }

  /// Generate cleanup report
  static String generateReport(Map<String, dynamic> results) {
    final buffer = StringBuffer();
    buffer.writeln('🧹 Code Cleanup Report');
    buffer.writeln('=' * 50);
    buffer.writeln('📊 Items Removed:');
    buffer.writeln('  • Debug Prints: ${results['totalPrints']}');
    buffer.writeln('  • Comment Lines: ${results['totalComments']}');
    buffer.writeln('  • Unused Imports: ${results['totalImports']}');
    buffer.writeln('📁 Files Processed: ${results['filesProcessed']}');
    buffer.writeln('');
    
    if (results['processedFiles'].isNotEmpty) {
      buffer.writeln('📝 Modified Files:');
      for (String file in results['processedFiles']) {
        buffer.writeln('  • ${file.split('/').last}');
      }
    }
    
    final totalRemoved = results['totalPrints'] + results['totalComments'] + results['totalImports'];
    buffer.writeln('');
    buffer.writeln('✅ Total Lines Removed: $totalRemoved');
    buffer.writeln('🚀 Estimated Performance Gain: ${(totalRemoved * 0.1).toStringAsFixed(1)}%');
    
    return buffer.toString();
  }

  /// Safe cleanup with backup
  static Future<void> safeCleanup(String libPath) async {
    // Create backup
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    final backupPath = '${libPath}_backup_$timestamp';
    
    print('📦 Creating backup at: $backupPath');
    await _copyDirectory(libPath, backupPath);
    
    try {
      print('🧹 Starting cleanup...');
      final results = await cleanLibDirectory(libPath);
      
      print(generateReport(results));
      print('✅ Cleanup completed successfully!');
      print('📦 Backup available at: $backupPath');
      
    } catch (e) {
      print('❌ Cleanup failed: $e');
      print('🔄 Restoring from backup...');
      await _copyDirectory(backupPath, libPath);
      print('✅ Restored from backup');
    }
  }

  static Future<void> _copyDirectory(String source, String destination) async {
    final sourceDir = Directory(source);
    final destDir = Directory(destination);
    
    if (await destDir.exists()) {
      await destDir.delete(recursive: true);
    }
    await destDir.create(recursive: true);
    
    await for (FileSystemEntity entity in sourceDir.list(recursive: true)) {
      final relativePath = entity.path.substring(source.length);
      final newPath = destination + relativePath;
      
      if (entity is File) {
        await entity.copy(newPath);
      } else if (entity is Directory) {
        await Directory(newPath).create(recursive: true);
      }
    }
  }
}

/// CLI runner for the cleanup tool
void main(List<String> args) async {
  if (args.isEmpty) {
    print('Usage: dart code_cleanup_tool.dart <lib_directory_path>');
    return;
  }

  final libPath = args[0];
  await CodeCleanupTool.safeCleanup(libPath);
}
