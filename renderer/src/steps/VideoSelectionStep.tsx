import { observer } from "mobx-react-lite";
import { useToastStore, useWorkoutStore } from "@/stores/context";
import { StepLayout } from "@/components/wizard/StepLayout";
import { FormSection } from "@/components/ui/FormField";
import { AsyncSection } from "@/components/ui/AsyncSection";
import { ErrorText } from "@/components/ui/Feedback";
import { VideoSelectionToolbar } from "@/components/video/VideoSelectionToolbar";
import { VideoCard } from "@/components/video/VideoCard";
import { WorkoutSummaryPanel } from "@/components/video/WorkoutSummaryPanel";
import styles from "@/components/video/VideoSelection.module.css";

export const VideoSelectionStep = observer(function VideoSelectionStep() {
  const workout = useWorkoutStore();
  const toasts = useToastStore();

  const handleToggle = (path: string) => {
    if (!workout.toggleVideo(path)) {
      toasts.show(
        `Your workout only has room for ${workout.selectionTarget} exercises — remove one first`,
        "warning"
      );
    }
  };

  return (
    <StepLayout step="videos">
      <FormSection>
        <VideoSelectionToolbar />

        <AsyncSection
          loading={workout.videosLoading}
          error={workout.videosError}
          isEmpty={workout.availableVideos.length === 0}
          loadingLabel="Loading available videos..."
          emptyLabel="No videos found for the selected categories, equipment and body groups"
        >
          <div className={styles.grid}>
            {workout.availableVideos.map((video) => (
              <VideoCard
                key={video.path}
                video={video}
                selected={workout.isVideoSelected(video.path)}
                onToggle={() => handleToggle(video.path)}
              />
            ))}
          </div>
        </AsyncSection>

        <ErrorText>{workout.visibleError("videos")}</ErrorText>

        <WorkoutSummaryPanel />
      </FormSection>
    </StepLayout>
  );
});
