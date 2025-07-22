# 💪 Workout Generator 🏋️

Generates a workout based on your inputs

![Demo](output.gif)

# Options available

1. Work time (e.g. 45 seconds work)
2. Rest time (e.g. 15 seconds rest)
3. Time between stations (e.g. 15 seconds to get ready)
4. Number of sets per station (e.g. 3 sets)
5. Total workout time (e.g. 60 minutes)
6. Type of workout (e.g. strength,cardio)
7. Equipment (e.g. kettlebell,dumbell,bands)

# Requirements

Must be on a \*nix

The script requires the following software to be installed on the host OS:

1. FFmpeg – for video and audio processing (used extensively throughout the script).
2. ffprobe – for getting video duration (part of the FFmpeg suite).
3. awk, sed, basename, find, mktemp, cat, rm – standard Unix command-line utilities (usually pre-installed on macOS and Linux).

If you are running on macOS or Linux, you mainly need to ensure FFmpeg (which includes ffprobe) is installed.

# Setup

Install FFmpeg if you don't already have it

- macOS: `brew install ffmpeg`
- Ubuntu/Debian: `sudo apt install ffmpeg`
- CentOS/RHEL: `sudo yum install ffmpeg`

Make sure `generate.sh` is executable, run `chmod +x generate.sh`.

# How to use

Run the following command in the terminal, from the repo directory:

`generate.sh`

Follow the prompts to customise your workout.

Once done, a new MP4 video will be saved for you.

# Excercise data source

https://github.com/yuhonas/free-exercise-db
