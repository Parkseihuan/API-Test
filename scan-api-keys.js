#!/usr/bin/env node

/**
 * API 키 사용 위치 스캔 스크립트
 *
 * 프로젝트 내 모든 파일을 검색하여 API 키가 사용되는 위치를 찾습니다.
 * 결과는 api-keys-usage.json 파일로 저장됩니다.
 */

const fs = require('fs');
const path = require('path');

// 설정
const CONFIG = {
    // 검색할 파일 확장자
    extensions: ['.html', '.js', '.ts', '.jsx', '.tsx', '.json', '.env', '.yml', '.yaml', '.txt', '.md'],

    // 제외할 디렉토리
    excludeDirs: ['.git', 'node_modules', 'dist', 'build', '.cache'],

    // 제외할 파일
    excludeFiles: ['scan-api-keys.js', 'api-keys-usage.json'],

    // 최대 파일 크기 (10MB)
    maxFileSize: 10 * 1024 * 1024,

    // API 키 패턴 (Gemini, OpenAI 등)
    apiKeyPatterns: [
        /AIza[0-9A-Za-z_-]{35}/g,           // Google API Key
        /sk-[A-Za-z0-9]{48}/g,              // OpenAI API Key
        /sk-ant-[A-Za-z0-9_-]{95,}/g,       // Anthropic API Key
        /[A-Za-z0-9]{32,}/g                 // 일반 API 키 패턴
    ]
};

// 색상 출력을 위한 ANSI 코드
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    red: '\x1b[31m',
    cyan: '\x1b[36m'
};

class APIKeyScanner {
    constructor() {
        this.results = {
            scannedAt: new Date().toISOString(),
            totalFiles: 0,
            totalMatches: 0,
            apiKeys: {},
            files: []
        };
        this.registeredKeys = this.loadRegisteredKeys();
    }

    // LocalStorage에서 등록된 키 불러오기 (없으면 빈 배열)
    loadRegisteredKeys() {
        try {
            // api-key-manager.html이 저장한 데이터를 로드하려면
            // 실제로는 사용자가 수동으로 keys.json 파일을 생성해야 함
            const keysFile = path.join(__dirname, 'registered-keys.json');
            if (fs.existsSync(keysFile)) {
                const data = JSON.parse(fs.readFileSync(keysFile, 'utf8'));
                console.log(`${colors.green}✓${colors.reset} ${data.length}개의 등록된 API 키를 불러왔습니다.`);
                return data;
            }
        } catch (error) {
            console.log(`${colors.yellow}⚠${colors.reset} 등록된 키 파일을 찾을 수 없습니다. 패턴 매칭으로 진행합니다.`);
        }
        return [];
    }

    // 디렉토리를 재귀적으로 스캔
    scanDirectory(dir) {
        const files = fs.readdirSync(dir);

        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);

            // 제외할 디렉토리 확인
            if (stat.isDirectory()) {
                if (!CONFIG.excludeDirs.includes(file)) {
                    this.scanDirectory(filePath);
                }
                continue;
            }

            // 파일 확장자 및 크기 확인
            const ext = path.extname(file);
            if (!CONFIG.extensions.includes(ext)) continue;
            if (CONFIG.excludeFiles.includes(file)) continue;
            if (stat.size > CONFIG.maxFileSize) continue;

            this.scanFile(filePath);
        }
    }

    // 파일 스캔
    scanFile(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const relativePath = path.relative(__dirname, filePath);

            this.results.totalFiles++;

            const lines = content.split('\n');
            const matches = [];

            // 등록된 키 검색
            this.registeredKeys.forEach(key => {
                const keyValue = key.value || key;
                const keyName = key.name || '알 수 없음';

                lines.forEach((line, index) => {
                    if (line.includes(keyValue)) {
                        matches.push({
                            line: index + 1,
                            content: line.trim().substring(0, 100),
                            keyName: keyName,
                            keyValue: this.maskKey(keyValue),
                            fullKeyValue: keyValue
                        });

                        // API 키별 사용 위치 추적
                        if (!this.results.apiKeys[keyValue]) {
                            this.results.apiKeys[keyValue] = {
                                name: keyName,
                                masked: this.maskKey(keyValue),
                                locations: []
                            };
                        }

                        this.results.apiKeys[keyValue].locations.push({
                            file: relativePath,
                            line: index + 1
                        });
                    }
                });
            });

            // 패턴으로 API 키 검색 (등록되지 않은 키 찾기)
            CONFIG.apiKeyPatterns.forEach(pattern => {
                lines.forEach((line, index) => {
                    const lineMatches = line.match(pattern);
                    if (lineMatches) {
                        lineMatches.forEach(match => {
                            // 이미 등록된 키는 건너뛰기
                            const isRegistered = this.registeredKeys.some(k =>
                                (k.value || k) === match
                            );

                            if (!isRegistered && match.length >= 20) {
                                matches.push({
                                    line: index + 1,
                                    content: line.trim().substring(0, 100),
                                    keyName: '미등록 키',
                                    keyValue: this.maskKey(match),
                                    fullKeyValue: match,
                                    isUnregistered: true
                                });

                                if (!this.results.apiKeys[match]) {
                                    this.results.apiKeys[match] = {
                                        name: '미등록 키',
                                        masked: this.maskKey(match),
                                        locations: [],
                                        isUnregistered: true
                                    };
                                }

                                this.results.apiKeys[match].locations.push({
                                    file: relativePath,
                                    line: index + 1
                                });
                            }
                        });
                    }
                });
            });

            // 매칭이 있으면 결과에 추가
            if (matches.length > 0) {
                this.results.files.push({
                    path: relativePath,
                    matches: matches
                });
                this.results.totalMatches += matches.length;
            }

        } catch (error) {
            console.error(`${colors.red}✗${colors.reset} 파일 읽기 실패: ${filePath}`, error.message);
        }
    }

    // API 키 마스킹
    maskKey(key) {
        if (key.length <= 12) return '***';
        return key.substring(0, 8) + '...' + key.substring(key.length - 4);
    }

    // 결과 저장
    saveResults() {
        const outputPath = path.join(__dirname, 'api-keys-usage.json');
        fs.writeFileSync(outputPath, JSON.stringify(this.results, null, 2), 'utf8');
        console.log(`\n${colors.green}✓${colors.reset} 스캔 결과가 저장되었습니다: ${colors.cyan}${outputPath}${colors.reset}`);
    }

    // 결과 출력
    printResults() {
        console.log('\n' + '='.repeat(60));
        console.log(`${colors.bright}📊 API 키 스캔 결과${colors.reset}`);
        console.log('='.repeat(60));

        console.log(`\n📁 스캔한 파일: ${colors.cyan}${this.results.totalFiles}${colors.reset}개`);
        console.log(`🔑 발견한 API 키: ${colors.cyan}${Object.keys(this.results.apiKeys).length}${colors.reset}개`);
        console.log(`📍 총 사용 위치: ${colors.cyan}${this.results.totalMatches}${colors.reset}곳`);

        if (Object.keys(this.results.apiKeys).length > 0) {
            console.log(`\n${colors.bright}🔍 API 키 상세 정보:${colors.reset}`);

            Object.entries(this.results.apiKeys).forEach(([key, info]) => {
                const status = info.isUnregistered ?
                    `${colors.red}[미등록]${colors.reset}` :
                    `${colors.green}[등록됨]${colors.reset}`;

                console.log(`\n  ${status} ${colors.bright}${info.name}${colors.reset}`);
                console.log(`    키: ${colors.yellow}${info.masked}${colors.reset}`);
                console.log(`    사용 위치 (${info.locations.length}곳):`);

                info.locations.forEach(loc => {
                    console.log(`      - ${colors.cyan}${loc.file}${colors.reset}:${colors.yellow}${loc.line}${colors.reset}`);
                });
            });
        }

        // 사용되지 않는 키 확인
        const usedKeyValues = new Set(Object.keys(this.results.apiKeys));
        const unusedKeys = this.registeredKeys.filter(key =>
            !usedKeyValues.has(key.value || key)
        );

        if (unusedKeys.length > 0) {
            console.log(`\n${colors.yellow}⚠ 사용되지 않는 등록된 키 (${unusedKeys.length}개):${colors.reset}`);
            unusedKeys.forEach(key => {
                const keyName = key.name || '알 수 없음';
                const keyValue = key.value || key;
                console.log(`  - ${keyName}: ${this.maskKey(keyValue)}`);
            });
        }

        console.log('\n' + '='.repeat(60) + '\n');
    }

    // 스캔 실행
    run() {
        console.log(`${colors.bright}🔍 API 키 스캔을 시작합니다...${colors.reset}\n`);

        const startTime = Date.now();
        this.scanDirectory(__dirname);
        const endTime = Date.now();

        this.printResults();
        this.saveResults();

        console.log(`⏱️  스캔 시간: ${colors.cyan}${(endTime - startTime) / 1000}${colors.reset}초\n`);
    }
}

// 스크립트 실행
if (require.main === module) {
    const scanner = new APIKeyScanner();
    scanner.run();
}

module.exports = APIKeyScanner;
