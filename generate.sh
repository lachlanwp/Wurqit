#!/bin/bash

# Workout Video Generator
# This script generates a workout video using exercise videos with countdown timers

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if FFMPEG is installed
check_ffmpeg() {
    if ! command -v ffmpeg &> /dev/null; then
        print_error "FFMPEG is not installed on your system."
        echo "Please install FFMPEG first:"
        echo "  macOS: brew install ffmpeg"
        echo "  Ubuntu/Debian: sudo apt install ffmpeg"
        echo "  CentOS/RHEL: sudo yum install ffmpeg"
        exit 1
    fi
    print_status "FFMPEG is installed and ready to use."
}

# Function to get user input with validation
get_user_input() {
    local prompt="$1"
    local default="$2"
    local input
    
    while true; do
        read -p "$prompt" input
        if [[ -n "$input" ]]; then
            echo "$input"
            return
        elif [[ -n "$default" ]]; then
            echo "$default"
            return
        else
            print_warning "Please enter a valid value."
        fi
    done
}

# Function to validate numeric input
validate_number() {
    local input="$1"
    local min="$2"
    local max="$3"
    
    if [[ "$input" =~ ^[0-9]+$ ]] && [ "$input" -ge "$min" ] && [ "$input" -le "$max" ]; then
        return 0
    else
        return 1
    fi
}

# Function to convert filename to readable exercise name
format_exercise_name() {
    local filename="$1"
    local basename=$(basename "$filename" .mp4)
    local basename=$(basename "$basename" .avi)
    local basename=$(basename "$basename" .mov)
    local basename=$(basename "$basename" .mkv)
    
    # Replace hyphens with spaces and capitalize only the first character
    echo "$basename" | sed 's/-/ /g' | awk '{print toupper(substr($0,1,1)) substr($0,2)}'
}

# Function to get exercise videos
get_exercise_videos() {
    local videos_dir="videos"
    local videos=()
    
    if [[ ! -d "$videos_dir" ]]; then
        print_error "Videos directory not found: $videos_dir"
        exit 1
    fi
    
    # Get all video files from videos directory
    while IFS= read -r -d '' file; do
        videos+=("$file")
    done < <(find "$videos_dir" -name "*.mp4" -print0)
    
    if [ ${#videos[@]} -eq 0 ]; then
        print_error "No exercise videos found in $videos_dir"
        exit 1
    fi
    
    # Only print filenames, not status messages
    printf '%s\n' "${videos[@]}"
}

# Function to create countdown video segment
create_countdown_segment() {
    local duration="$1"
    local text="$2"
    local output_file="$3"
    
    print_status "Creating countdown segment: $text (${duration}s)"
    
    # Check if BEEP.mp3 exists
    local beep_file="media/BEEP.mp3"
    local audio_input=""
    if [[ -f "$beep_file" ]]; then
        audio_input="-i $beep_file"
    fi
    
    # Choose background color based on text
    local bg_color="black"
    if [[ "$text" == "REST" ]]; then
        bg_color="darkred"
    elif [[ "$text" == "NEXT EXERCISE" ]]; then
        bg_color="darkblue"
    fi
    
    # Create countdown video with text overlay and beep sound
    ffmpeg -f lavfi -i color=c=$bg_color:size=1920x1080:duration=$duration \
        $audio_input \
        -filter_complex "[0:v]drawtext=text='$text':fontcolor=white:fontsize=72:x=(w-text_w)/2:y=(h-text_h)/2,drawtext=text='%{eif\:($duration-t)\:d\:2}':fontcolor=white:fontsize=120:x=(w-text_w)/2:y=(h-text_h)/2+100[v];[1:a]adelay=0|0[beep]" \
        -map "[v]" -map "[beep]" \
        -c:v libx264 -preset fast -crf 23 -c:a aac -y "$output_file"
    
    if [[ $? -ne 0 ]]; then
        print_error "Failed to create countdown segment: $output_file"
        return 1
    fi
    
    if [[ ! -f "$output_file" ]]; then
        print_error "Countdown segment file not created: $output_file"
        return 1
    fi
    
    print_status "Countdown segment created: $output_file"
    return 0
}

# Function to create progress grid visualization using FFmpeg drawtext
create_progress_grid_overlay() {
    local current_station="$1"
    local current_set="$2"
    local total_stations="$3"
    local sets_per_station="$4"
    
    local filter_parts=""
    local video_width=1920
    local video_height=1080
    local top_margin=50
    local bottom_margin=50
    local left_margin=50
    local right_margin=50
    
    # Calculate total cells needed (all sets for all stations)
    local total_cells=$((total_stations * sets_per_station))
    
    # Calculate available width for the grid
    local available_width=$((video_width - left_margin - right_margin))
    
    # Set fixed cell width to 15px
    local cell_width=15
    
    # Calculate how many cells can fit per row
    local cells_per_row=$((available_width / cell_width))
    
    # Calculate number of rows needed
    local rows_needed=$(( (total_cells + cells_per_row - 1) / cells_per_row ))
    local cell_height=40
    
    # Position grid at the top of the screen
    local grid_top_margin=50
    
    # Calculate total grid width including extra spacing between stations
    local extra_spacing_cells=$(( (total_stations - 1) * 2 ))  # Two extra cells per station (except last)
    local total_grid_width=$(( (total_cells + extra_spacing_cells) * cell_width ))
    local grid_start_x=$(( (video_width - total_grid_width) / 2 ))
    
    # --- First pass: determine number of cells (including spacing) per row ---
    local -a row_cell_counts=()
    local sim_cell_index=0
    local sim_row=0
    for ((station=0; station<total_stations; station++)); do
        for ((set=1; set<=sets_per_station; set++)); do
            if (( sim_cell_index % cells_per_row == 0 )); then
                sim_row=${#row_cell_counts[@]}
                row_cell_counts+=(0)
            fi
            row_cell_counts[$sim_row]=$((row_cell_counts[$sim_row]+1))
            if [[ $set -eq $sets_per_station ]] && [[ $station -lt $((total_stations - 1)) ]]; then
                # Add 2 extra cells for spacing
                for s in 1 2; do
                    sim_cell_index=$((sim_cell_index+1))
                    if (( sim_cell_index % cells_per_row == 0 )); then
                        sim_row=${#row_cell_counts[@]}
                        row_cell_counts+=(0)
                    fi
                    row_cell_counts[$sim_row]=$((row_cell_counts[$sim_row]+1))
                done
            fi
            sim_cell_index=$((sim_cell_index+1))
        done
    done

    # --- Second pass: draw cells, using per-row centering ---
    local cell_index=0
    local row=0
    local row_col=0
    for ((station=0; station<total_stations; station++)); do
        for ((set=1; set<=sets_per_station; set++)); do
            row=$((cell_index / cells_per_row))
            if (( cell_index % cells_per_row == 0 )); then
                row_col=0
            fi
            local row_cells=${row_cell_counts[$row]}
            local row_width=$((row_cells * cell_width))
            local row_start_x=$(( (video_width - row_width) / 2 ))
            local x=$((row_start_x + row_col * cell_width))
            local y=$((grid_top_margin + row * cell_height))

            # Determine cell color based on status
            local cell_color="gray"
            if [[ $station -eq $current_station ]] && [[ $set -eq $current_set ]]; then
                cell_color="lightblue"
            elif [[ $station -lt $current_station ]] || ([[ $station -eq $current_station ]] && [[ $set -lt $current_set ]]); then
                cell_color="darkblue"
            fi

            # Draw cell box (no border)
            filter_parts+="drawbox=x=$x:y=$y:w=$cell_width:h=$cell_height:color=$cell_color:t=fill,"

            # Add set number at bottom of cell (centered)
            local set_text_x=$((x + cell_width / 2))
            local set_text_y=$((y + cell_height - 5))
            filter_parts+="drawtext=text='$set':fontcolor=white:fontsize=12:x=$set_text_x-text_w/2:y=$set_text_y:box=1:boxcolor=black@0.5:boxborderw=1:line_spacing=0:fix_bounds=1,"

            # Add extra horizontal padding between stations (except after last station)
            if [[ $set -eq $sets_per_station ]] && [[ $station -lt $((total_stations - 1)) ]]; then
                row_col=$((row_col + 2))
                cell_index=$((cell_index + 2))  # Skip 2 extra cells for 30px spacing
            fi
            row_col=$((row_col + 1))
            cell_index=$((cell_index + 1))
        done
    done

    # --- Draw station numbers (centered above each group) ---
    # Redo cell_index for station label placement
    cell_index=0
    for ((station=0; station<total_stations; station++)); do
        row=$((cell_index / cells_per_row))
        col=$((cell_index % cells_per_row))
        local row_cells=${row_cell_counts[$row]}
        local row_width=$((row_cells * cell_width))
        local row_start_x=$(( (video_width - row_width) / 2 ))
        local station_start_col=$((col))
        local station_end_col=$((col + sets_per_station - 1))
        local station_start_x=$((row_start_x + station_start_col * cell_width))
        local station_end_x=$((row_start_x + (station_end_col + 1) * cell_width))
        local station_center_x=$(((station_start_x + station_end_x) / 2))
        local station_text_x=$station_center_x
        local station_text_y=$((grid_top_margin - 20 + row * cell_height))
        filter_parts+="drawtext=text='$((station + 1))':fontcolor=white:fontsize=14:x=$station_text_x-text_w/2:y=$station_text_y:box=1:boxcolor=black@0.7:boxborderw=2:line_spacing=0:fix_bounds=1,"
        # Advance cell_index for this station
        for ((set=1; set<=sets_per_station; set++)); do
            if [[ $set -eq $sets_per_station ]] && [[ $station -lt $((total_stations - 1)) ]]; then
                cell_index=$((cell_index + 2))
            fi
            cell_index=$((cell_index + 1))
        done
    done
    
    # Remove trailing comma
    filter_parts="${filter_parts%,}"
    
    echo "$filter_parts"
}

# Function to create exercise video segment
create_exercise_segment() {
    local video_file="$1"
    local duration="$2"
    local current_station="$3"
    local current_set="$4"
    local total_stations="$5"
    local sets_per_station="$6"
    local output_file="$7"
    
    print_status "Creating exercise segment: $(basename "$video_file") (Station $((current_station + 1)), Set $current_set)"
    
    # Check if video file exists
    if [[ ! -f "$video_file" ]]; then
        print_error "Video file not found: $video_file"
        return 1
    fi
    
    # Get exercise name for display
    local exercise_name=$(format_exercise_name "$video_file")
    
    # Check if BEEP.mp3 exists
    local beep_file="media/BEEP.mp3"
    local audio_input=""
    if [[ -f "$beep_file" ]]; then
        audio_input="-i $beep_file"
    fi
    
    # Create progress grid overlay
    local grid_overlay=$(create_progress_grid_overlay "$current_station" "$current_set" "$total_stations" "$sets_per_station")
    
    # Create exercise video with looped video, exercise name, progress grid, countdown, and beep sound
    ffmpeg -stream_loop -1 -t $duration -i "$video_file" \
        -f lavfi -i color=c=darkgreen:size=1920x1080:duration=$duration \
        $audio_input \
        -filter_complex "[0:v]scale=-1:600:force_original_aspect_ratio=decrease[scaled];[1:v][scaled]overlay=(W-w)/2:(H-h)/2,drawtext=text='$exercise_name':fontcolor=white:fontsize=60:x=(w-text_w)/2:y=h-200,drawtext=text='%{eif\:($duration-t)\:d\:2}':fontcolor=white:fontsize=72:x=(w-text_w)/2:y=h-100,$grid_overlay[v];[2:a]adelay=0|0[beep]" \
        -map "[v]" -map "[beep]" \
        -c:v libx264 -preset fast -crf 23 -c:a aac -y "$output_file"
    
    if [[ $? -ne 0 ]]; then
        print_error "Failed to create exercise segment: $output_file"
        return 1
    fi
    
    if [[ ! -f "$output_file" ]]; then
        print_error "Exercise segment file not created: $output_file"
        return 1
    fi
    
    print_status "Exercise segment created: $output_file"
    return 0
}

# Function to create station change segment with next exercise preview
create_station_change_segment() {
    local duration="$1"
    local next_exercise_file="$2"
    local output_file="$3"
    
    print_status "Creating station change segment with preview: $(basename "$next_exercise_file") (${duration}s)"
    
    # Check if video file exists
    if [[ ! -f "$next_exercise_file" ]]; then
        print_error "Next exercise video not found: $next_exercise_file"
        return 1
    fi
    
    # Get next exercise name for display
    local next_exercise_name=$(format_exercise_name "$next_exercise_file")
    
    # Check if BEEP.mp3 exists
    local beep_file="media/BEEP.mp3"
    local audio_input=""
    if [[ -f "$beep_file" ]]; then
        audio_input="-i $beep_file"
    fi
    
    # Create station change video with preview of next exercise
    ffmpeg -stream_loop -1 -t $duration -i "$next_exercise_file" \
        -f lavfi -i color=c=black:size=1920x1080:duration=$duration \
        $audio_input \
        -filter_complex "[0:v]scale=600:600:force_original_aspect_ratio=decrease,pad=600:600:(ow-iw)/2:(oh-ih)/2[scaled];[1:v][scaled]overlay=(W-w)/2:(H-h)/2-150,drawtext=text='NEXT EXERCISE':fontcolor=white:fontsize=72:x=(w-text_w)/2:y=50,drawtext=text='$next_exercise_name':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=150,drawtext=text='%{eif\:($duration-t)\:d\:2}':fontcolor=white:fontsize=120:x=(w-text_w)/2:y=h-100[v];[2:a]adelay=0|0[beep]" \
        -map "[v]" -map "[beep]" \
        -c:v libx264 -preset fast -crf 23 -c:a aac -y "$output_file"
    
    if [[ $? -ne 0 ]]; then
        print_error "Failed to create station change segment: $output_file"
        return 1
    fi
    
    if [[ ! -f "$output_file" ]]; then
        print_error "Station change segment file not created: $output_file"
        return 1
    fi
    
    print_status "Station change segment created: $output_file"
    return 0
}

# Function to create file list for concatenation
create_file_list() {
    local file_list="$1"
    local segments=("${@:2}")
    
    > "$file_list"
    for segment in "${segments[@]}"; do
        echo "file '$segment'" >> "$file_list"
    done
}

# Main script
main() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}    WORKOUT VIDEO GENERATOR    ${NC}"
    echo -e "${BLUE}================================${NC}"
    echo
    
    # Check FFMPEG installation
    check_ffmpeg
    
    # Get user inputs
    echo -e "${YELLOW}Please enter the following parameters:${NC}"
    echo
    
    # Set duration
    work_duration=$(get_user_input "Enter work duration in seconds (default: 45): " "45")
    if ! validate_number "$work_duration" 10 300; then
        print_error "Invalid work duration. Please enter a number between 10 and 300 seconds."
        exit 1
    fi
    
    # Rest duration
    rest_duration=$(get_user_input "Enter rest duration in seconds (default: 15): " "15")
    if ! validate_number "$rest_duration" 5 120; then
        print_error "Invalid rest duration. Please enter a number between 5 and 120 seconds."
        exit 1
    fi
    
    # Sets per station
    sets_per_station=$(get_user_input "Enter number of sets per station (default: 3): " "3")
    if ! validate_number "$sets_per_station" 1 10; then
        print_error "Invalid sets per station. Please enter a number between 1 and 10."
        exit 1
    fi
    
    # Rest between stations
    station_rest=$(get_user_input "Enter rest time between stations in seconds (default: 15): " "15")
    if ! validate_number "$station_rest" 5 60; then
        print_error "Invalid station rest time. Please enter a number between 5 and 60 seconds."
        exit 1
    fi
    
    # Total workout duration
    total_workout_duration=$(get_user_input "Enter total workout duration in minutes (default: 60): " "60")
    if ! validate_number "$total_workout_duration" 5 180; then
        print_error "Invalid total workout duration. Please enter a number between 5 and 180 minutes."
        exit 1
    fi
    
    echo
    print_status "Parameters set:"
    echo "  Work duration: ${work_duration}s"
    echo "  Rest duration: ${rest_duration}s"
    echo "  Sets per station: ${sets_per_station}"
    echo "  Station rest time: ${station_rest}s"
    echo "  Total workout duration: ${total_workout_duration} minutes"
    echo
    
    # Get exercise videos
    print_status "Loading exercise videos..."
    exercise_videos=()
    while IFS= read -r line; do
      exercise_videos+=("$line")
    done < <(get_exercise_videos)
    
    if [ ${#exercise_videos[@]} -eq 0 ]; then
        print_error "No exercise videos found!"
        exit 1
    fi
    
    print_status "Loaded ${#exercise_videos[@]} exercise videos."
    
    # Calculate how many exercises we can fit in the total workout time
    local total_seconds=$((total_workout_duration * 60))
    local time_per_exercise=$((work_duration * sets_per_station + rest_duration * (sets_per_station - 1) + station_rest))
    local max_exercises=$((total_seconds / time_per_exercise))
    
    if [ $max_exercises -lt 1 ]; then
        print_error "Workout parameters result in no exercises fitting in ${total_workout_duration} minutes."
        print_error "Try reducing work duration, rest duration, or sets per station."
        exit 1
    fi
    
    # Randomly select exercises
    local selected_exercises=()
    local available_exercises=("${exercise_videos[@]}")
    
    for ((i=0; i<max_exercises && i<${#available_exercises[@]}; i++)); do
        local random_index=$((RANDOM % ${#available_exercises[@]}))
        selected_exercises+=("${available_exercises[$random_index]}")
        # Remove selected exercise to avoid duplicates
        unset "available_exercises[$random_index]"
        available_exercises=("${available_exercises[@]}")
    done
    
    print_status "Selected ${#selected_exercises[@]} exercises for ${total_workout_duration} minute workout."
    
    # Use selected exercises instead of all exercises
    exercise_videos=("${selected_exercises[@]}")
    
    # Calculate total workout time
    local total_sets=$((sets_per_station * ${#exercise_videos[@]}))
    local total_work_time=$((total_sets * work_duration))
    local total_rest_time=$((total_sets * rest_duration))
    local total_station_rest=$(((${#exercise_videos[@]} - 1) * station_rest))
    local total_time=$((total_work_time + total_rest_time + total_station_rest))
    
    print_status "Estimated total workout time: ${total_time} seconds ($(($total_time / 60)) minutes)"
    
    # Create temporary directory for video segments
    temp_dir=$(mktemp -d)
    print_status "Creating temporary directory: $temp_dir"
    
    # Generate video segments
    print_status "Generating video segments..."
    segments=()
    segment_count=0
    
    for ((i=0; i<${#exercise_videos[@]}; i++)); do
        exercise_name=$(basename "${exercise_videos[$i]}" .mp4)
        print_status "Processing exercise: $exercise_name"
        
        # Create sets for this exercise
        for ((set=1; set<=sets_per_station; set++)); do
            # Work segment
            work_file="$temp_dir/work_${segment_count}.mp4"
            if ! create_exercise_segment "${exercise_videos[$i]}" "$work_duration" "$i" "$set" "${#exercise_videos[@]}" "$sets_per_station" "$work_file"; then
                print_error "Failed to create work segment for exercise: $exercise_name"
                exit 1
            fi
            segments+=("$work_file")
            ((segment_count++))
            
            # Rest segment (except after last set of last exercise)
            if [[ $set -lt $sets_per_station ]] || [[ $i -lt $((${#exercise_videos[@]} - 1)) ]]; then
                rest_file="$temp_dir/rest_${segment_count}.mp4"
                if ! create_countdown_segment "$rest_duration" "REST" "$rest_file"; then
                    print_error "Failed to create rest segment"
                    exit 1
                fi
                segments+=("$rest_file")
                ((segment_count++))
            fi
        done
        
        # Station rest (except after last exercise)
        if [[ $i -lt $((${#exercise_videos[@]} - 1)) ]]; then
            station_rest_file="$temp_dir/station_rest_${segment_count}.mp4"
            next_exercise="${exercise_videos[$((i+1))]}"
            if ! create_station_change_segment "$station_rest" "$next_exercise" "$station_rest_file"; then
                print_error "Failed to create station change segment"
                exit 1
            fi
            segments+=("$station_rest_file")
            ((segment_count++))
        fi
    done
    
    # Create file list for concatenation
    file_list="$temp_dir/file_list.txt"
    create_file_list "$file_list" "${segments[@]}"
    
    # Concatenate all segments
    output_file="workout_video_$(date +%Y%m%d_%H%M%S).mp4"
    print_status "Concatenating video segments..."
    
    # Show file list for debugging
    print_status "File list contents:"
    cat "$file_list"
    
    ffmpeg -f concat -safe 0 -i "$file_list" -c copy -y "$output_file"
    
    if [[ $? -eq 0 ]] && [[ -f "$output_file" ]]; then
        print_status "Workout video created successfully: $output_file"
        
        # Get video duration
        duration=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$output_file" 2>/dev/null)
        if [[ -n "$duration" ]]; then
            print_status "Video duration: ${duration} seconds"
        fi
    else
        print_error "Failed to create workout video."
        print_error "FFMPEG exit code: $?"
        print_error "Output file exists: $([[ -f "$output_file" ]] && echo "Yes" || echo "No")"
        exit 1
    fi
    
    # Clean up temporary files
    print_status "Cleaning up temporary files..."
    rm -rf "$temp_dir"
    
    echo
    print_status "Workout video generation complete!"
    echo "Output file: $output_file"
}

# Run main function
main "$@" 