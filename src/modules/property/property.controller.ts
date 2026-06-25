import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PropertyService } from './property.service';
import { CreatePropertyDto } from './dto/create.property.dto';
import { GetCurrentUser } from 'src/common/decorator/get-current-user.decorator';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CalculateBrrrPropertyDto } from './dto/calculate.brrrr.property.dto';
import { CalculateTurnkeyPropertyDto } from './dto/calculate.turnkey.property.dto';
import { CalculateSection8Dto } from './dto/calculate.section8.dto';
import { CreateBrrrrDto } from './dto/create.save.brrr.property.dto';
import { CreateTurnkeyDTO_Mod } from './dto/save.turnkey.property.dto';
import { Section8RequestDto } from './dto/section.e.request.dto';
import { EnrichAddressDto } from './dto/enrich-address.dto';

@ApiTags('Property')
@Controller('property')
export class PropertyController {
  constructor(private readonly propertyService: PropertyService) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // ADDRESS ENRICHMENT
  // ═══════════════════════════════════════════════════════════════════════════

  @Post('enrich-address')
  @ApiOperation({
    summary: 'Geocode an address and fetch all enrichment data in parallel',
    description:
      'Step 1 of the analyzer workflow. Accepts a raw address string and returns structured ' +
      'geocode data, HUD Fair Market Rents (by bedroom), RentCast rental & sold comps, ' +
      'and FBI Crime Data — all in a single response. ' +
      'The FBI crime dashboard includes a risk score (LOW/MEDIUM/HIGH), ' +
      'offense breakdown by type (theft, assault, burglary, etc.), area name, ' +
      'and a plain-language crime summary for the resolved city or state. ' +
      'Feed the returned values into the calculate endpoints for a full analysis.',
  })
  async enrichAddress(@Body() dto: EnrichAddressDto) {
    return this.propertyService.enrichAddress(dto.address);
  }

  @Post('test-hud-section8')
  @ApiOperation({
    summary: 'Test HUD FMR API specifically for Section 8',
    description: 'Provide an address, it geocodes it, looks up the FIPS code, and fetches the precise HUD FMR data using the Section 8 logic.',
  })
  async testHudSection8(@Body() dto: EnrichAddressDto) {
    return this.propertyService.testHudSection8(dto.address);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CALCULATORS
  // ═══════════════════════════════════════════════════════════════════════════

  @Post('calculate-brrrr')
  @ApiOperation({
    summary: 'Calculate BRRRR strategy metrics',
    description:
      'Full BRRRR analysis including ARV, Refinance Loan Amount, Cash Out, ' +
      'Cash Left In Deal, Equity Captured, Post-Refi CoC, DSCR, and Deal Scoreboard. ' +
      'Refinance logic ONLY exists in this endpoint.',
  })
  async calculateBrrrr(@Body() dto: CalculateBrrrPropertyDto) {
    return this.propertyService.calculateBrrrr(dto);
  }

  @Post('calculate-turnkey')
  @ApiOperation({
    summary: 'Calculate Turnkey strategy metrics',
    description:
      'Standard buy-and-hold analysis. Supports both absolute ($) and ' +
      'percentage-based (%) down payments. No refinance logic.',
  })
  async calculateTurnkeyFull(@Body() dto: CalculateTurnkeyPropertyDto) {
    return this.propertyService.generateTurnkeyReport(dto);
  }

  @Post('calculate-section8')
  @ApiOperation({
    summary: 'Calculate Section 8 / DSCR strategy metrics (clean endpoint)',
    description:
      'Clean Section 8 analysis. Supports down-payment percent, accepts HUD FMR rent ' +
      '(from /enrich-address) for accurate rent cap modeling. No refinance fields. ' +
      'Scoreboard includes DSCR, Cash Flow, Cap Rate, CoC Return, and 1% Rule.',
  })
  async calculateSection8(@Body() dto: CalculateSection8Dto) {
    return this.propertyService.calculateSection8(dto);
  }

  /**
   * @deprecated Use POST /property/calculate-section8 instead.
   * Kept for backward compatibility with existing clients.
   */
  @Post('calculate-Section8_DSCR')
  @ApiOperation({
    summary: '[DEPRECATED] Legacy Section 8 DSCR calculator',
    description:
      'Legacy endpoint — kept for backward compatibility. ' +
      'Please migrate to POST /property/calculate-section8.',
    deprecated: true,
  })
  async generateSection8_DSCR(@Body() dto: CreatePropertyDto) {
    return this.propertyService.generateSection8_DSCR(dto);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // USER SAVED CALCULATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  @ApiBearerAuth()
  @Get('user-calculations')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get all property calculations for the authenticated user (paginated)',
  })
  @ApiQuery({ name: 'page', required: false, example: 1, description: 'Page number (default: 1)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 10,
    description: 'Items per page (default: 10)',
  })
  async getAllCalculationsForUser(
    @GetCurrentUser('userId') userId: string,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
  ) {
    return this.propertyService.getAllCalculationsForUser(userId, page, limit);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get a specific property calculation by its ID' })
  @Get(':propertyId')
  getCalculationById(@Param('propertyId') propertyId: string) {
    return this.propertyService.getCalculationById(propertyId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a specific property calculation by its ID' })
  @Delete('delete/:propertyId')
  deleteCalculationById(
    @GetCurrentUser('userId') userId: string,
    @Param('propertyId') propertyId: string,
  ) {
    return this.propertyService.deleteCalculationById(propertyId, userId);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SAVE (persist calculation results)
  // ═══════════════════════════════════════════════════════════════════════════

  @Post('save-brrr-property')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Save a BRRRR calculation to the database' })
  async saveBrrrProperty(
    @GetCurrentUser('userId') userId: string,
    @Body() dto: CreateBrrrrDto,
  ) {
    return this.propertyService.saveBrrrProperty(userId, dto);
  }

  @Post('save-turnkey-property')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Save a Turnkey calculation to the database' })
  async saveTurnkeyProperty(
    @GetCurrentUser('userId') userId: string,
    @Body() dto: CreateTurnkeyDTO_Mod,
  ) {
    return this.propertyService.saveTurnkeyProperty(userId, dto);
  }

  @Post('save-section8-property')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Save a Section 8 calculation to the database' })
  async saveSection8Property(
    @Body() dto: Section8RequestDto,
    @GetCurrentUser('userId') userId: string,
  ) {
    return this.propertyService.saveSection8Property(userId, dto);
  }
}
