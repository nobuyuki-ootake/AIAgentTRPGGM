import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Grid,
} from '@mui/material';
import {
  Hotel,
  Store,
  Build,
  AccountBalance,
  Group,
  Construction,
  LocalOffer,
  AttachMoney,
  Schedule,
  Star,
} from '@mui/icons-material';
import { BaseLocation } from '@trpg-ai-gm/types';

interface FacilityInteractionPanelProps {
  base: any;
  onInteract: (facility: any) => void;
}

export const FacilityInteractionPanel: React.FC<FacilityInteractionPanelProps> = ({
  base: currentBase,
  onInteract: onFacilityAction,
}) => {
  const [selectedFacility, setSelectedFacility] = useState<any>(null);
  const [facilityDialog, setFacilityDialog] = useState(false);

  if (!currentBase || !currentBase.facilities) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" color="text.secondary">
            この場所には利用可能な施設がありません
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const { facilities } = currentBase;

  const handleFacilityClick = (facility: any, type: string) => {
    setSelectedFacility({ ...facility, type });
    setFacilityDialog(true);
  };

  const handleFacilityAction = (action: string) => {
    if (selectedFacility) {
      onFacilityAction(selectedFacility.type, action);
      setFacilityDialog(false);
    }
  };

  const getFacilityIcon = (type: string) => {
    switch (type) {
      case 'inn': return <Hotel />;
      case 'shop': return <Store />;
      case 'blacksmith': return <Build />;
      case 'temple': return <AccountBalance />;
      case 'guild': return <Group />;
      case 'armory': return <Construction />;
      default: return <Store />;
    }
  };

  const renderFacilityActions = () => {
    if (!selectedFacility) return null;

    switch (selectedFacility.type) {
      case 'inn':
        return (
          <Stack spacing={2}>
            <Button 
              variant="contained" 
              onClick={() => handleFacilityAction('rest')}
              startIcon={<Hotel />}
            >
              宿泊する ({selectedFacility.pricePerNight}ゴールド)
            </Button>
            {selectedFacility.services?.includes('healing') && (
              <Button 
                variant="outlined" 
                onClick={() => handleFacilityAction('heal')}
                startIcon={<Star />}
              >
                回復サービスを受ける
              </Button>
            )}
            {selectedFacility.services?.includes('information') && (
              <Button 
                variant="outlined" 
                onClick={() => handleFacilityAction('information')}
              >
                情報を収集する
              </Button>
            )}
          </Stack>
        );

      case 'shop':
        return (
          <Stack spacing={2}>
            <Button 
              variant="contained" 
              onClick={() => handleFacilityAction('browse')}
              startIcon={<LocalOffer />}
            >
              商品を見る
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => handleFacilityAction('buy')}
              startIcon={<AttachMoney />}
            >
              アイテムを購入する
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => handleFacilityAction('sell')}
            >
              アイテムを売る
            </Button>
          </Stack>
        );

      case 'blacksmith':
        return (
          <Stack spacing={2}>
            <Button 
              variant="contained" 
              onClick={() => handleFacilityAction('repair')}
              startIcon={<Build />}
            >
              装備を修理する
            </Button>
            {selectedFacility.services?.includes('upgrade') && (
              <Button 
                variant="outlined" 
                onClick={() => handleFacilityAction('upgrade')}
              >
                装備を強化する
              </Button>
            )}
            {selectedFacility.services?.includes('craft') && (
              <Button 
                variant="outlined" 
                onClick={() => handleFacilityAction('craft')}
              >
                装備を作成する
              </Button>
            )}
          </Stack>
        );

      case 'temple':
        return (
          <Stack spacing={2}>
            <Button 
              variant="contained" 
              onClick={() => handleFacilityAction('pray')}
              startIcon={<AccountBalance />}
            >
              祈りを捧げる
            </Button>
            {selectedFacility.functions?.includes('healing') && (
              <Button 
                variant="outlined" 
                onClick={() => handleFacilityAction('divine_healing')}
                startIcon={<Star />}
              >
                神聖魔法で回復する
              </Button>
            )}
            {selectedFacility.functions?.includes('resurrection') && (
              <Button 
                variant="outlined" 
                color="error"
                onClick={() => handleFacilityAction('resurrect')}
              >
                蘇生術を受ける
              </Button>
            )}
            {selectedFacility.donation && (
              <Button 
                variant="outlined" 
                onClick={() => handleFacilityAction('donate')}
                startIcon={<AttachMoney />}
              >
                寄付をする (推奨: {selectedFacility.donation}ゴールド)
              </Button>
            )}
          </Stack>
        );

      case 'guild':
        return (
          <Stack spacing={2}>
            <Button 
              variant="contained" 
              onClick={() => handleFacilityAction('check_quests')}
              startIcon={<Group />}
            >
              クエストを確認する
            </Button>
            {selectedFacility.services?.includes('member_services') && (
              <Button 
                variant="outlined" 
                onClick={() => handleFacilityAction('member_services')}
              >
                ギルドサービスを利用する
              </Button>
            )}
            {!selectedFacility.membershipRequired && (
              <Button 
                variant="outlined" 
                onClick={() => handleFacilityAction('join')}
              >
                ギルドに加入する
              </Button>
            )}
          </Stack>
        );

      case 'armory':
        return (
          <Stack spacing={2}>
            <Button 
              variant="contained" 
              onClick={() => handleFacilityAction('buy_weapons')}
              startIcon={<Construction />}
            >
              武器を購入する
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => handleFacilityAction('buy_armor')}
            >
              防具を購入する
            </Button>
            {selectedFacility.specialItems && (
              <Button 
                variant="outlined" 
                color="secondary"
                onClick={() => handleFacilityAction('special_items')}
              >
                特別なアイテムを見る
              </Button>
            )}
          </Stack>
        );

      default:
        return (
          <Button 
            variant="contained" 
            onClick={() => handleFacilityAction('interact')}
          >
            利用する
          </Button>
        );
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        🏛️ {currentBase.name} - 利用可能施設
      </Typography>
      
      <Grid container spacing={2}>
        {/* 宿屋 */}
        {facilities.inn && (
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Card 
              sx={{ cursor: 'pointer' }}
              onClick={() => handleFacilityClick(facilities.inn, 'inn')}
            >
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Hotel color="primary" />
                  <Typography variant="h6">{facilities.inn.name}</Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {facilities.inn.description || '宿泊・休息サービス'}
                </Typography>
                <Chip 
                  label={`${facilities.inn.pricePerNight}G/泊`} 
                  size="small" 
                  color="primary" 
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* 店舗 */}
        {facilities.shops?.map((shop: any, index: number) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
            <Card 
              sx={{ cursor: 'pointer' }}
              onClick={() => handleFacilityClick(shop, 'shop')}
            >
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Store color="primary" />
                  <Typography variant="h6">{shop.name}</Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {shop.type} - {shop.description || '一般商店'}
                </Typography>
                <Chip 
                  label={`価格倍率: ${shop.priceModifier}`} 
                  size="small" 
                  color={shop.priceModifier > 1 ? 'error' : 'success'}
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>
          </Grid>
        ))}

        {/* 鍛冶屋 */}
        {facilities.blacksmith && (
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Card 
              sx={{ cursor: 'pointer' }}
              onClick={() => handleFacilityClick(facilities.blacksmith, 'blacksmith')}
            >
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Build color="primary" />
                  <Typography variant="h6">{facilities.blacksmith.name}</Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {facilities.blacksmith.description || '武器・防具の修理・強化'}
                </Typography>
                {facilities.blacksmith.services && (
                  <Box sx={{ mt: 1 }}>
                    {facilities.blacksmith.services.map((service: string, idx: number) => (
                      <Chip key={idx} label={service} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* 神殿 */}
        {facilities.temple && (
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Card 
              sx={{ cursor: 'pointer' }}
              onClick={() => handleFacilityClick(facilities.temple, 'temple')}
            >
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center">
                  <AccountBalance color="primary" />
                  <Typography variant="h6">{facilities.temple.name}</Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {facilities.temple.deity}の神殿
                </Typography>
                <Typography variant="caption" display="block">
                  {facilities.temple.description || '祈り・回復・蘇生サービス'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* ギルド */}
        {facilities.guild && (
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Card 
              sx={{ cursor: 'pointer' }}
              onClick={() => handleFacilityClick(facilities.guild, 'guild')}
            >
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Group color="primary" />
                  <Typography variant="h6">{facilities.guild.name}</Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {facilities.guild.type}
                </Typography>
                <Typography variant="caption" display="block">
                  {facilities.guild.description || 'クエスト・ギルドサービス'}
                </Typography>
                {facilities.guild.membershipRequired && (
                  <Chip label="会員制" size="small" color="warning" sx={{ mt: 1 }} />
                )}
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* 武具屋 */}
        {facilities.armory && (
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Card 
              sx={{ cursor: 'pointer' }}
              onClick={() => handleFacilityClick(facilities.armory, 'armory')}
            >
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Construction color="primary" />
                  <Typography variant="h6">{facilities.armory.name}</Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {facilities.armory.description || '武器・防具専門店'}
                </Typography>
                <Box sx={{ mt: 1 }}>
                  {facilities.armory.weaponTypes?.slice(0, 3).map((type: string, idx: number) => (
                    <Chip key={idx} label={type} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* その他施設 */}
        {facilities.otherFacilities?.map((facility: any, index: number) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
            <Card 
              sx={{ cursor: 'pointer' }}
              onClick={() => handleFacilityClick(facility, 'other')}
            >
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center">
                  {getFacilityIcon(facility.type)}
                  <Typography variant="h6">{facility.name}</Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {facility.type}
                </Typography>
                <Typography variant="caption" display="block">
                  {facility.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* 施設詳細ダイアログ */}
      <Dialog 
        open={facilityDialog} 
        onClose={() => setFacilityDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" spacing={1} alignItems="center">
            {selectedFacility && getFacilityIcon(selectedFacility.type)}
            <Typography variant="h6">
              {selectedFacility?.name}
            </Typography>
          </Stack>
        </DialogTitle>
        
        <DialogContent>
          {selectedFacility && (
            <Box>
              <Typography variant="body1" gutterBottom>
                {selectedFacility.description || '詳細な説明はありません。'}
              </Typography>

              <Divider sx={{ my: 2 }} />

              {/* 施設固有の情報表示 */}
              {selectedFacility.type === 'inn' && (
                <List dense>
                  <ListItem>
                    <ListItemIcon><AttachMoney /></ListItemIcon>
                    <ListItemText 
                      primary="宿泊料金" 
                      secondary={`${selectedFacility.pricePerNight}ゴールド/泊`} 
                    />
                  </ListItem>
                  {selectedFacility.services && (
                    <ListItem>
                      <ListItemIcon><Star /></ListItemIcon>
                      <ListItemText 
                        primary="提供サービス" 
                        secondary={selectedFacility.services.join(', ')} 
                      />
                    </ListItem>
                  )}
                </List>
              )}

              {selectedFacility.type === 'shop' && (
                <List dense>
                  <ListItem>
                    <ListItemIcon><LocalOffer /></ListItemIcon>
                    <ListItemText 
                      primary="店舗タイプ" 
                      secondary={selectedFacility.type} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><AttachMoney /></ListItemIcon>
                    <ListItemText 
                      primary="価格倍率" 
                      secondary={`${selectedFacility.priceModifier}倍`} 
                    />
                  </ListItem>
                  {selectedFacility.items && (
                    <ListItem>
                      <ListItemIcon><Store /></ListItemIcon>
                      <ListItemText 
                        primary="取扱商品" 
                        secondary={selectedFacility.items.slice(0, 5).join(', ')} 
                      />
                    </ListItem>
                  )}
                </List>
              )}

              {selectedFacility.type === 'temple' && (
                <List dense>
                  <ListItem>
                    <ListItemIcon><AccountBalance /></ListItemIcon>
                    <ListItemText 
                      primary="祭神" 
                      secondary={selectedFacility.deity} 
                    />
                  </ListItem>
                  {selectedFacility.functions && (
                    <ListItem>
                      <ListItemIcon><Star /></ListItemIcon>
                      <ListItemText 
                        primary="提供機能" 
                        secondary={selectedFacility.functions.join(', ')} 
                      />
                    </ListItem>
                  )}
                  {selectedFacility.donation && (
                    <ListItem>
                      <ListItemIcon><AttachMoney /></ListItemIcon>
                      <ListItemText 
                        primary="推奨寄付額" 
                        secondary={`${selectedFacility.donation}ゴールド`} 
                      />
                    </ListItem>
                  )}
                </List>
              )}

              <Divider sx={{ my: 2 }} />

              {/* 利用可能時間の表示 */}
              {currentBase?.npcSchedule && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    <Schedule /> 営業時間
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    朝・昼・夕方・夜（詳細はNPCスケジュールに依存）
                  </Typography>
                </Box>
              )}

              {/* 文化的修正値の表示 */}
              {currentBase?.culturalModifiers && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    🌍 地域の特徴
                  </Typography>
                  {currentBase.culturalModifiers.priceModifier !== 1 && (
                    <Typography variant="caption" display="block">
                      💰 物価修正: {(currentBase.culturalModifiers.priceModifier * 100).toFixed(0)}%
                    </Typography>
                  )}
                  {currentBase.culturalModifiers.negotiationDC && (
                    <Typography variant="caption" display="block">
                      🗣️ 交渉難易度: DC{currentBase.culturalModifiers.negotiationDC}
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setFacilityDialog(false)}>
            キャンセル
          </Button>
          <Box sx={{ flex: 1 }}>
            {renderFacilityActions()}
          </Box>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FacilityInteractionPanel;