import { Module } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { ProjectsModule } from '../projects/projects.module';


@Module({
  imports: [ProjectsModule],
  providers: [CommentsService],
  controllers: [CommentsController],
})
export class CommentsModule { }

