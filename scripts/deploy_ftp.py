"""BLACK-OUT 웹 업로드 (실습 호스팅 FTP) — /www/team2/ 안에만 올립니다.

사용 (PowerShell, C:\\readyon 에서):
    $env:FTP_PASS='비밀번호'; python scripts/deploy_ftp.py
올릴 폴더 기본값은 바탕 화면\\team2 이고, 다른 폴더는 인자로 줍니다:  python scripts/deploy_ftp.py D:\\site

지키는 것
- /www/team2 가 없으면 아무것도 만들지 않고 멈춥니다. 폴더 생성·덮어쓰기는 /www/team2 안에서만 합니다.
- 삭제는 하지 않습니다. (있던 index.html 등 같은 이름 파일만 새 파일로 덮어씀)
- index.html 이 없거나, 비밀키·서버 파일(.php .py .env key.txt 등)이 있거나, 파일 이름에 한글·띄어쓰기가 있으면 올리지 않고 멈춥니다.
- 비밀번호는 파일에 적지 않고 FTP_PASS 환경변수로만 받습니다.
"""
import ftplib
import os
import pathlib
import sys

HOST, USER, REMOTE = 'educnp.mycafe24.com', 'educnp', '/www/team2'
BLOCKED_SUFFIX = {'.php', '.py', '.env', '.key', '.pem'}
BLOCKED_NAMES = {'key.txt', '.env'}


def main():
    src = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else pathlib.Path.home() / 'Desktop' / 'team2'
    password = os.environ.get('FTP_PASS') or sys.exit('FTP_PASS 환경변수에 비밀번호를 넣어 주세요.')
    files = sorted(p for p in src.rglob('*') if p.is_file())
    if not (src / 'index.html').is_file():
        sys.exit(f'{src} 에 index.html 이 없어요. 홈페이지 폴더가 맞는지 확인해 주세요.')
    bad = [p.name for p in files if p.suffix.lower() in BLOCKED_SUFFIX or p.name.lower() in BLOCKED_NAMES]
    if bad:
        sys.exit(f'비밀키·서버 파일이 섞여 있어 멈춰요: {bad}')
    odd = [p.relative_to(src).as_posix() for p in files if not p.relative_to(src).as_posix().isascii() or ' ' in p.name]
    if odd:
        sys.exit(f'파일 이름에 한글이나 띄어쓰기가 있어요. 영어로 바꿔 주세요: {odd}')

    ftp = ftplib.FTP(HOST, timeout=60)
    ftp.login(USER, password)
    try:
        ftp.cwd(REMOTE)  # 없으면 여기서 오류 → 아무것도 만들지 않음
    except ftplib.error_perm:
        sys.exit(f'FTP에 {REMOTE} 폴더가 없어요. 아무것도 올리지 않았어요.')

    for i, p in enumerate(files, 1):
        rel = p.relative_to(src).as_posix()
        ftp.cwd(REMOTE)
        for d in rel.split('/')[:-1]:  # 하위 폴더는 team2 안에서만 만듦
            try:
                ftp.cwd(d)
            except ftplib.error_perm:
                ftp.mkd(d)
                ftp.cwd(d)
        with open(p, 'rb') as f:
            ftp.storbinary(f'STOR {p.name}', f)
        print(f'[{i}/{len(files)}] {rel}')
    ftp.quit()
    print(f'완료: https://{HOST}/team2/')


if __name__ == '__main__':
    main()
