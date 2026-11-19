import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SearchService } from './search.service';

@ApiTags('Search Tìm kiếm toàn cục')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Tìm kiếm dự án và công việc toàn hệ thống' })
  @ApiQuery({ name: 'q', required: true, description: 'Từ khóa tìm kiếm' })
  search(@Req() req: any, @Query('q') query: string) {
    return this.searchService.search(req.user.id, query);
  }
}
