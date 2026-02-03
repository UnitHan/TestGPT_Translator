#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
아이콘 생성 스크립트
PNG 이미지를 다양한 사이즈의 ICO 및 ICNS 파일로 변환
"""

from PIL import Image
import os
import sys

def create_icons(input_png, output_dir='.'):
    """
    PNG 이미지를 다양한 사이즈의 아이콘 파일로 변환
    
    Args:
        input_png: 입력 PNG 파일 경로
        output_dir: 출력 디렉토리
    """
    print(f"입력 파일: {input_png}")
    
    if not os.path.exists(input_png):
        print(f"❌ 파일을 찾을 수 없습니다: {input_png}")
        return False
    
    try:
        # 원본 이미지 로드
        img = Image.open(input_png)
        print(f"원본 크기: {img.size}")
        
        # RGBA 모드로 변환 (투명도 지원)
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
        
        # 정사각형으로 크롭 (중앙 기준)
        width, height = img.size
        if width != height:
            print(f"정사각형이 아닙니다. 중앙을 기준으로 크롭합니다...")
            size = min(width, height)
            left = (width - size) // 2
            top = (height - size) // 2
            right = left + size
            bottom = top + size
            img = img.crop((left, top, right, bottom))
            print(f"크롭 후 크기: {img.size}")
        
        # Windows ICO 파일 생성 (다양한 크기 포함)
        print("\n🔨 Windows ICO 파일 생성 중...")
        ico_sizes = [(16, 16), (32, 32), (48, 48), (64, 64), 
                     (128, 128), (256, 256), (512, 512)]
        
        ico_images = []
        for size in ico_sizes:
            resized = img.resize(size, Image.Resampling.LANCZOS)
            ico_images.append(resized)
            print(f"  ✓ {size[0]}x{size[1]} 생성")
        
        # ICO 파일로 저장 (모든 사이즈 포함)
        ico_path = os.path.join(output_dir, 'icon.ico')
        
        # 가장 큰 이미지부터 저장 (역순)
        ico_images[0].save(
            ico_path,
            format='ICO',
            sizes=ico_sizes
        )
        
        file_size = os.path.getsize(ico_path)
        print(f"✅ ICO 파일 저장: {ico_path} ({file_size:,} bytes)")
        
        # build 폴더에도 복사
        build_dir = os.path.join(output_dir, 'build')
        if os.path.exists(build_dir):
            build_ico_path = os.path.join(build_dir, 'icon.ico')
            ico_images[0].save(
                build_ico_path,
                format='ICO',
                sizes=ico_sizes
            )
            file_size = os.path.getsize(build_ico_path)
            print(f"✅ ICO 파일 저장: {build_ico_path} ({file_size:,} bytes)")
        
        # 개별 PNG 파일도 생성 (필요시)
        print("\n🔨 개별 PNG 파일 생성 중...")
        for size in ico_sizes:
            resized = img.resize(size, Image.Resampling.LANCZOS)
            png_filename = f'icon_{size[0]}x{size[1]}.png'
            png_path = os.path.join(output_dir, png_filename)
            resized.save(png_path, 'PNG')
            print(f"  ✓ {png_filename} 생성")
        
        # macOS ICNS 파일 생성 (iconutil 대신 간단한 방법)
        print("\n🔨 macOS ICNS용 PNG 파일 준비 중...")
        icns_sizes = [
            (16, 'icon_16x16.png'),
            (32, 'icon_16x16@2x.png'),
            (32, 'icon_32x32.png'),
            (64, 'icon_32x32@2x.png'),
            (128, 'icon_128x128.png'),
            (256, 'icon_128x128@2x.png'),
            (256, 'icon_256x256.png'),
            (512, 'icon_256x256@2x.png'),
            (512, 'icon_512x512.png'),
            (1024, 'icon_512x512@2x.png'),
        ]
        
        iconset_dir = os.path.join(output_dir, 'icon.iconset')
        os.makedirs(iconset_dir, exist_ok=True)
        
        for size, filename in icns_sizes:
            if size <= max(img.size):
                resized = img.resize((size, size), Image.Resampling.LANCZOS)
                icns_path = os.path.join(iconset_dir, filename)
                resized.save(icns_path, 'PNG')
                print(f"  ✓ {filename} 생성")
        
        print(f"\n📁 ICNS iconset 폴더: {iconset_dir}")
        print("   macOS에서 다음 명령으로 ICNS 생성:")
        print(f"   iconutil -c icns {iconset_dir}")
        
        print("\n" + "="*50)
        print("✅ 아이콘 생성 완료!")
        print("="*50)
        return True
        
    except Exception as e:
        print(f"\n❌ 오류 발생: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == '__main__':
    if len(sys.argv) > 1:
        input_file = sys.argv[1]
    else:
        input_file = 'icon.png'
    
    print("="*50)
    print("아이콘 생성 도구")
    print("="*50)
    print()
    
    success = create_icons(input_file)
    
    if success:
        print("\n사용 방법:")
        print("  Windows: icon.ico 파일 사용")
        print("  macOS: iconutil로 icon.icns 생성 후 사용")
        sys.exit(0)
    else:
        sys.exit(1)
