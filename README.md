# Subtitle Auto Verification

Add verification checks in subtitles in order to detect common issues with subtitled video.

## Issues checked

- Check if the subtitle is being rendered in libass, otherwise show an error message;
- Check if embedded fonts are loaded, otherwise show an error message:

## Public reception

![](https://i.imgur.com/PEUbHiw.png)
    
## Research

Because libass [is probably the most popular subtitle renderer](https://github.com/libass/libass/#related-links) many groups recommend players that use it in order to reduce the chances of issues caused by cross-renderer differences. This code explores the fact libass support [custom format lines](https://github.com/libass/libass/wiki/Libass'-ASS-Extensions#custom-format-lines) in order to make sure subtitles can only be loaded in the recommended players (or, in more exact words, using the recommended renderer). Note that, while this change will make the modified subtitles not work in Aegisub, Subtitle Edit will still support them.

A survey done in April of 2021 on some members of a BitTorrent tracker showed that 27.8% of them had set up their players to not load embedded subtitles. The player used don't seem to be the cause of this issue: the users that had this issue used VLC, mpv, MPC-HC and CCCP's MPC-HC, yet there were other uses using the same players which hadn't this issue. In order to detect when embedded fonts are not loaded this code adds an error message in the subtitle using a font that renders all characters as spaces. In case this font is not loaded then the error message will appear. This verification can handle player misconfiguration and cases of users badly handling video files forgetting to handle fonts properly, but cannot detect when just some specific font is not loaded (like players which don't load fonts above a certain size to avoid performance issues).

## Usage

### Using Deno

This method is the safer one since it allows you to check the code and not having to thrust the project contributors. First install Deno, download the source code and run the following:

```sh
deno run --allow-read --allow-write convert_subtitle.ts INPUT_SUBTITLE.ass OUTPUT_SUBTITLE.ass
```

You can also install the script globally as a command [as described here](https://deno.land/manual@v1.21.0/tools/script_installer) and/or load it from the network [as described here](https://deno.land/manual@v1.21.0/getting_started/first_steps). It was tested with Deno 1.21.0.

To get more info about which arguments are supported you can call the script with `--help` which will return something like this:

```
OPTIONS:
        -s, --source <STRING>  Source subtitle file (omit to read from standard input)
        -t, --target <STRING>  Target subtitle file (omit to write to standard output)
        --no-libass-check      Skip libass handling
        --no-font-check        Skip font handling
```

Notice that this code will not handle embedding neither the subtitle nor the font into a video file. Those steps need to be followed separately using the tool of your choice (like mkvmerge or ffmpeg). The font can be downloaded in the "the-invisible-font" folder. It only support Latin characters (including some accented characters). The font's license is [OFL](http://scripts.sil.org/OFL) because I'm not a lawyer, but it's quite easy to remake it.

## Using pre-compiled binaries

You can also download pre-compiled binaries for Windows x64, macOS x64, macOS ARM and Linux x64 compiled using [`deno compile`](https://deno.land/manual@v1.21.0/tools/compiler) available [in the Releases page](https://github.com/qgustavor/Subtitle-Auto-Verification/releases). They behave the same as the above, but the `--allow-*` flags are not needed:

```sh
convert_subtitle INPUT_SUBTITLE.ass OUTPUT_SUBTITLE.ass
```

## Testing

Install Deno and ffmpeg, then run test.sh or test.bat in order to test the code. It will generate a 30 second test video (if not existent), run the code on the test subtitle and mux the video with the test subtitle and the generated subtitle. Open those files in multiple players (mainly in players that use libass and players which don't use it, players set up to load embedded fonts and players set up to not load those) and check if the code is working as intended.
