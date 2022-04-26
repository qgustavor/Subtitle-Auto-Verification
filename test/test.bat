rem Create base video if not exits
if not exist base_video.mkv ffmpeg -f lavfi -i testsrc=d=30:s=1920x1080:r=24,format=yuv420p -f lavfi -i sine=f=440:b=4 -shortest base_video.mkv

rem Run script
deno run ..\convert_subtitle.ts < source.ass > result.ass

rem Mux source and result files using ffmpeg
ffmpeg -i base_video.mkv -i source.ass -map 0:v -map 0:a -map 1 -codec copy -disposition:s:0 default -attach ..\the-invisible-font\TheInvisibleFont.ttf -metadata:s:t mimetype=application/x-truetype-font source_video.mkv -y
ffmpeg -i base_video.mkv -i result.ass -map 0:v -map 0:a -map 1 -codec copy -disposition:s:0 default -attach ..\the-invisible-font\TheInvisibleFont.ttf -metadata:s:t mimetype=application/x-truetype-font result_video.mkv -y

echo Open source_video.mkv and result_video.mkv and check if they work as intended.
