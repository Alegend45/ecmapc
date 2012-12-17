function PIT()
{
	var self = this;
	self.accessm = 0;
	self.mode = 0;
	self.counter0 = 0;
	self.counter1 = 0;
	self.counter2 = 0;
}

function DMAchan()
{
	var self = this;
	self.mode = 0;
	self.length = 0;
}

function DMA()
{
	var self = this;
	self.chan0 = new DMAchan();
	self.chan1 = new DMAchan();
	self.chan2 = new DMAchan();
	self.chan3 = new DMAchan();
	self.enabled = false;
}

function PIC()
{
	var self = this;
	self.cascade = false;
	self.enabled = false;
	self.imr = 0;
	self.isr = 0;
	self.irr = 0;
	self.icw4_need = false;
	self.state = 'INIT';
	self.vector_base = 0;
}

function CPU(type,mem)
{
	var self = this;
	self.type = type;
	self.ax = 0;
	self.bx = 0;
	self.cx = 0;
	self.dx = 0;
	self.cs = 0xF000;
	self.ip = 0xFFF0;
	self.ss = 0;
	self.ds = 0;
	self.es = 0;
	self.flags = 2;
	self.memory = mem;
	self.pit = new PIT();
	self.dma = new DMA();
	self.pic = new PIC();
	self.io_r = function(addr)
	{
	}
	self.io_w = function(addr, data)
	{
		switch(addr)
		{
			case 0x01:
			{
				self.dma.chan0.length = (self.dma.chan0.length & 0xFF00) | (data & 0xFF);
				break;
			}
			case 0x08:
			{
				self.dma.enabled = (data & 4) ? true : false;
				break;
			}
			case 0x0A:
			{
				switch(data & 3)
				{
					case 0:
					{
						self.dma.chan0.masked = (data & 4) ? true : false;
						break;
					}
					case 1:
					{
						self.dma.chan1.mode = (data & 4) ? true : false;
						break;
					}
					case 2:
					{
						self.dma.chan2.mode = (data & 4) ? true : false;
						break;
					}
					case 3:
					{
						self.dma.chan3.mode = (data & 4) ? true : false;
						break;
					}
				}
				break;
			}
			case 0x0B:
			{
				switch(data & 3)
				{
					case 0:
					{
						self.dma.chan0.mode = (data & 0xFC) >> 2;
						break;
					}
					case 1:
					{
						self.dma.chan1.mode = (data & 0xFC) >> 2;
						break;
					}
					case 2:
					{
						self.dma.chan2.mode = (data & 0xFC) >> 2;
						break;
					}
					case 3:
					{
						self.dma.chan3.mode = (data & 0xFC) >> 2;
						break;
					}
				}
				break;
			}
			case 0x20:
			{
				if(data & 0x10)
				{
					self.pic.cascade = (data & 2) ? false : true;
					self.pic.icw4_need = (data & 1) ? true : false;
					self.pic.state = 'ICW2';
				}
				break;
			}
			case 0x21:
			{
				switch(self.pic.state)
				{
					case 'INIT':
					{
						break;
					}
					case 'ICW2':
					{
						self.pic.vector_base = data;
						if(self.pic.cascade) self.pic.state = 'ICW3';
						else self.pic.state = (self.icw4_need) ? 'ICW4' : 'READY';
						break;
					}
					case 'ICW3':
					{
						alert('AT setups for a PIC are not supported yet!');
						break;
					}
					case 'ICW4':
					{
						break;
					}
					case 'READY':
					{
						self.pic.imr = data;
						break;
					}
				}
				break;
			}
			case 0x41:
			{
				switch(self.pit.accessm)
				{
					case 1:
					{
						switch(data & 0xC0)
						{
							case 0x40:
							{
								self.pit.counter1 = (self.pit.counter1 & 0xFF00) | (data & 0xFF);
							}
						}
						break;
					}
				}
				break;
			}
			case 0x43:
			{
				self.pit.accessm = (data & 0x30) >> 4;
				self.pit.mode = (data & 0x0E) >> 1;
				break;
			}
			default:
			{
				break;
			}
		}
	}
	self.exec =
	function()
	{
		self.op = self.memory[(self.cs<<4)+self.ip];
		//document.getElementById('opcode').innerHTML += '<br />' + self.op;
		switch(self.op)
		{
			case 0x02:
			{
				var modrm = self.memory[((self.cs<<4)+self.ip)+1];
				switch(modrm)
				{
					case 0x07:
					{
						self.ax = (self.ax & 0xFF00) | ((self.ax & 0xFF) + self.memory[(self.ds<<4)+self.bx]);
						//document.getElementById('opcode').innerHTML += '<br />' + 'ADD AL, BYTE PTR DS:[BX]';
						if((self.ax & 0xFF) == 0) self.flags |= 0x0040;
						else self.flags &= 0xFFBF;
						var tmp = 0;
						for(var i = 0;i<8;i++)
						{
							if((self.ax & 0xFF) & (1<<i)) tmp = (tmp + 1) & 1;
						}
						if(tmp&1) self.flags &= 0xFFFB;
						else self.flags |= 0x0004;
						break;
					}
				}
				self.ip+=2;
				break;
			}
			case 0x03:
			{
				var modrm = self.memory[((self.cs<<4)+self.ip)+1];
				switch(modrm)
				{
					case 0xC3:
					{
						self.ax += self.bx;
						//document.getElementById('opcode').innerHTML += '<br />' + 'ADD AX, BX';
						if(self.ax == 0) self.flags |= 0x0040;
						else self.flags &= 0xFFBF;
						var tmp = 0;
						for(var i = 0;i<16;i++)
						{
							if(self.ax & (1<<i)) tmp = (tmp + 1) & 1;
						}
						if(tmp&1) self.flags &= 0xFFFB;
						else self.flags |= 0x0004;
						break;
					}
				}
				self.ip+=2;
				break;
			}
			case 0x05:
			{
				var tmp = (self.memory[((self.cs<<4)+self.ip)+2]<<8)|self.memory[((self.cs<<4)+self.ip)+1];
				self.ax = (self.ax + tmp) & 0xFFFF;
				//document.getElementById('opcode').innerHTML += '<br />ADD AX, ' + tmp;
				self.ip+=3;
				if(self.ax == 0) self.flags |= 0x0040;
				else self.flags &= 0xFFBF;
				var tmp = 0;
				for(var i = 0;i<16;i++)
				{
					if(self.ax & (1<<i)) tmp = (tmp + 1) & 1;
				}
				if(tmp&1) self.flags &= 0xFFFB;
				else self.flags |= 0x0004;
				break;
			}
			case 0x06:
			{
				//document.getElementById('opcode').innerHTML += '<br />' + 'PUSH ES';
				self.sp-=2;
				self.memory[(self.ss<<4)+self.sp] = self.es & 0xFF;
				self.memory[(self.ss<<4)+self.sp+1] = self.es >> 8;
				self.ip++;
				break;
			}
			case 0x0A:
			{
				var modrm = self.memory[((self.cs<<4)+self.ip)+1];
				switch(modrm)
				{
					case 0xC0:
					{
						//document.getElementById('opcode').innerHTML += '<br />' + 'OR AL, AL';
						if((self.ax & 0xFF) == 0) self.flags |= 0x0040;
						else self.flags &= 0xFFBF;
						var tmp = 0;
						for(var i = 0;i<8;i++)
						{
							if((self.ax & 0xFF) & (1<<i)) tmp = (tmp + 1) & 1;
						}
						if(tmp&1) self.flags &= 0xFFFB;
						else self.flags |= 0x0004;
						break;
					}
				}
				self.ip+=2;
				break;
			}
			case 0x0C:
			{
				var tmp = self.memory[((self.cs<<4)+self.ip)+1];
				self.ax = ((self.ax & 0xFF00) | ((self.ax & 0xFF) | tmp)) & 0xFFFF;
				//document.getElementById('opcode').innerHTML += '<br />OR AL, ' + tmp;
				self.ip+=3;
				if((self.ax & 0xFF) == 0) self.flags |= 0x0040;
				else self.flags &= 0xFFBF;
				var tmp = 0;
				for(var i = 0;i<8;i++)
				{
					if((self.ax & 0xFF) & (1<<i)) tmp = (tmp + 1) & 1;
				}
				if(tmp&1) self.flags &= 0xFFFB;
				else self.flags |= 0x0004;
				break;
			}
			case 0x0E:
			{
				//document.getElementById('opcode').innerHTML += '<br />' + 'PUSH CS';
				self.sp-=2;
				self.memory[(self.ss<<4)+self.sp] = self.cs & 0xFF;
				self.memory[(self.ss<<4)+self.sp+1] = self.cs >> 8;
				self.ip++;
				break;
			}
			case 0x16:
			{
				//document.getElementById('opcode').innerHTML += '<br />' + 'PUSH SS';
				self.sp-=2;
				self.memory[(self.ss<<4)+self.sp] = self.ss & 0xFF;
				self.memory[(self.ss<<4)+self.sp+1] = self.ss >> 8;
				self.ip++;
				break;
			}
			case 0x1E:
			{
				//document.getElementById('opcode').innerHTML += '<br />' + 'PUSH DS';
				self.sp-=2;
				self.memory[(self.ss<<4)+self.sp] = self.ds & 0xFF;
				self.memory[(self.ss<<4)+self.sp+1] = self.ds >> 8;
				self.ip++;
				break;
			}
			case 0x1F:
			{
				//document.getElementById('opcode').innerHTML += '<br />' + 'POP DS';
				self.ds = (self.memory[(self.ss<<4)+self.sp+1]<<8)|self.memory[(self.ss<<4)+self.sp];
				self.sp += 2;
				self.ip++;
				break;
			}
			case 0x24:
			{
				var tmp = self.memory[((self.cs<<4)+self.ip)+1];
				self.ax = ((self.ax & 0xFF00) | ((self.ax & 0xFF) & tmp)) & 0xFFFF;
				//document.getElementById('opcode').innerHTML += '<br />AND AL, ' + tmp;
				self.ip+=3;
				if((self.ax & 0xFF) == 0) self.flags |= 0x0040;
				else self.flags &= 0xFFBF;
				var tmp = 0;
				for(var i = 0;i<8;i++)
				{
					if((self.ax & 0xFF) & (1<<i)) tmp = (tmp + 1) & 1;
				}
				if(tmp&1) self.flags &= 0xFFFB;
				else self.flags |= 0x0004;
				break;
			}
			case 0x26:
			{
				var op2 = self.memory[((self.cs<<4)+self.ip)+1];
				switch(op2)
				{
					case 0x3A:
					{
						var modrm = self.memory[((self.cs<<4)+self.ip)+2];
						switch(modrm)
						{
							case 0x05:
							{
								//document.getElementById('opcode').innerHTML += '<br />' + 'CMP AL, BYTE PTR ES:[DI]';
								var tmp1 = (self.ax & 0xFF) - self.memory[(self.es<<4)+self.di];
								if(tmp1 == 0) self.flags |= 0x0040;
								else self.flags &= 0xFFBF;
								var tmp2 = 0;
								for(var i = 0;i<8;i++)
								{
									if(tmp1 & (1<<i)) tmp2 = (tmp2 + 1) & 1;
								}
								if(tmp2&1) self.flags &= 0xFFFB;
								else self.flags |= 0x0004;
								if(tmp1>=0x80) self.flags |= 0x0080;
								else self.flags &= 0xFF7F;
								break;
							}
						}
						self.ip++;
						break;
					}
					case 0x3B:
					{
						var modrm = self.memory[((self.cs<<4)+self.ip)+2];
						switch(modrm)
						{
							case 0x15:
							{
								//document.getElementById('opcode').innerHTML += '<br />' + 'CMP DX, WORD PTR ES:[DI]';
								var tmp1 = self.dx - (self.memory[(self.es<<4)+self.di] | (self.memory[(self.es<<4)+self.di+1]<<8));
								if(tmp1 == 0) self.flags |= 0x0040;
								else self.flags &= 0xFFBF;
								var tmp2 = 0;
								for(var i = 0;i<16;i++)
								{
									if(tmp1 & (1<<i)) tmp2 = (tmp2 + 1) & 1;
								}
								if(tmp2&1) self.flags &= 0xFFFB;
								else self.flags |= 0x0004;
								if(tmp1>=0x8000) self.flags |= 0x0080;
								else self.flags &= 0xFF7F;
								break;
							}
						}
						self.ip++;
						break;
					}
					case 0x88:
					{
						var modrm = self.memory[((self.cs<<4)+self.ip)+2];
						switch(modrm)
						{
							case 0x05:
							{
								//document.getElementById('opcode').innerHTML += '<br />' + 'MOV BYTE PTR ES:[DI], AL';
								self.memory[(self.es<<4)+self.di] = self.ax & 0xFF;
								break;
							}
						}
						self.ip++;
						break;
					}
					case 0x89:
					{
						var modrm = self.memory[((self.cs<<4)+self.ip)+2];
						switch(modrm)
						{
							case 0x15:
							{
								//document.getElementById('opcode').innerHTML += '<br />' + 'MOV WORD PTR ES:[DI], DX';
								self.memory[(self.es<<4)+self.di] = self.dx & 0xFF;
								self.memory[(self.es<<4)+self.di+1] = (self.dx >> 8) & 0xFF;
								break;
							}
						}
						self.ip++;
						break;
					}
					case 0xC7:
					{
						var modrm = self.memory[((self.cs<<4)+self.ip)+2];
						switch(modrm)
						{
							case 0x06:
							{
								var tmp = (self.memory[((self.cs<<4)+self.ip)+4]<<8)|self.memory[((self.cs<<4)+self.ip)+3];
								var tmp1 = (self.memory[((self.cs<<4)+self.ip)+6]<<8)|self.memory[((self.cs<<4)+self.ip)+5];
								//document.getElementById('opcode').innerHTML += '<br />' + 'MOV WORD PTR ES:' + tmp + ', ' + tmp1;
								self.memory[(self.es<<4)+tmp] = tmp1 >> 8;
								self.memory[(self.es<<4)+tmp+1] = tmp1 & 0xFF;
								self.ip+=2;
								break;
							}
						}
						self.ip+=4;
						break;
					}
				}
				self.ip+=2;
				break;
			}
			case 0x2D:
			{
				var tmp = (self.memory[((self.cs<<4)+self.ip)+2]<<8)|self.memory[((self.cs<<4)+self.ip)+1];
				self.ax = (self.ax - tmp) & 0xFFFF;
				//document.getElementById('opcode').innerHTML += '<br />' + 'SUB AX, ' + tmp;
				self.ip+=3;
				if(self.ax == 0) self.flags |= 0x0040;
				else self.flags &= 0xFFBF;
				var tmp2 = 0;
				for(var i = 0;i<16;i++)
				{
					if(self.ax & (1<<i)) tmp2 = (tmp2 + 1) & 1;
				}
				if(tmp2&1) self.flags &= 0xFFFB;
				else self.flags |= 0x0004;
				if(self.ax>=0x8000) self.flags |= 0x0080;
				else self.flags &= 0xFF7F;
				break;
			}
			case 0x32:
			{
				var modrm = self.memory[((self.cs<<4)+self.ip)+1];
				switch(modrm)
				{
					case 0xC0:
					{
						self.ax = self.ax & 0xFF00; //XOR 0,0 gives 0, and XOR 1,1 gives 0, so XORing any value with itself gives 0.
						//document.getElementById('opcode').innerHTML += '<br />' + 'XOR AL, AL';
						self.flags &= 0xFFBA;
						self.flags |= 0x0044;
						break;
					}
				}
				self.ip+=2;
				break;
			}
			case 0x33:
			{
				var modrm = self.memory[((self.cs<<4)+self.ip)+1];
				switch(modrm)
				{
					case 0xC0:
					{
						self.ax = 0; //XOR 0,0 gives 0, and XOR 1,1 gives 0, so XORing any value with itself gives 0.
						//document.getElementById('opcode').innerHTML += '<br />' + 'XOR AX, AX';
						self.flags &= 0xFFBA;
						self.flags |= 0x0044;
						break;
					}
					case 0xDB:
					{
						self.bx = 0; //XOR 0,0 gives 0, and XOR 1,1 gives 0, so XORing any value with itself gives 0.
						//document.getElementById('opcode').innerHTML += '<br />' + 'XOR AX, AX';
						self.flags &= 0xFFBA;
						self.flags |= 0x0044;
						break;
					}
					case 0xFF:
					{
						self.di = 0; //XOR 0,0 gives 0, and XOR 1,1 gives 0, so XORing any value with itself gives 0.
						//document.getElementById('opcode').innerHTML += '<br />' + 'XOR DI, DI';
						self.flags &= 0xFFBA;
						self.flags |= 0x0044;
						break;
					}
				}
				self.ip+=2;
				break;
			}
			case 0x35:
			{
				var tmp = (self.memory[((self.cs<<4)+self.ip)+2]<<8)|self.memory[((self.cs<<4)+self.ip)+1];
				self.ax = (self.ax ^ tmp) & 0xFFFF;
				//document.getElementById('opcode').innerHTML += '<br />' + 'XOR AX, ' + tmp;
				self.ip+=3;
				if(self.ax == 0) self.flags |= 0x0040;
				else self.flags &= 0xFFBF;
				var tmp2 = 0;
				for(var i = 0;i<16;i++)
				{
					if(self.ax & (1<<i)) tmp2 = (tmp2 + 1) & 1;
				}
				if(tmp2&1) self.flags &= 0xFFFB;
				else self.flags |= 0x0004;
				if(self.ax>=0x8000) self.flags |= 0x0080;
				else self.flags &= 0xFF7F;
				break;
			}
			case 0x3A:
			{
				var modrm = self.memory[((self.cs<<4)+self.ip)+2];
				switch(modrm)
				{
					case 0xD6:
					{
						//document.getElementById('opcode').innerHTML += '<br />' + 'CMP DL, DH';
						var tmp1 = ((self.dx & 0xFF) - ((self.dx & 0xFF00) >> 8)) & 0xFF;
						if(tmp1 == 0) self.flags |= 0x0040;
						else self.flags &= 0xFFBF;
						var tmp2 = 0;
						for(var i = 0;i<8;i++)
						{
							if(tmp1 & (1<<i)) tmp2 = (tmp2 + 1) & 1;
						}
						if(tmp2&1) self.flags &= 0xFFFB;
						else self.flags |= 0x0004;
						if(tmp1>=0x80) self.flags |= 0x0080;
						else self.flags &= 0xFF7F;
						break;
					}
				}
				self.ip+=2;
				break;
			}
			case 0x3D:
			{
				var tmp = (self.memory[((self.cs<<4)+self.ip)+2]<<8)|self.memory[((self.cs<<4)+self.ip)+1];
				var tmp1 = (self.ax - tmp) & 0xFFFF;
				//document.getElementById('opcode').innerHTML += '<br />' + 'CMP AX, ' + tmp;
				self.ip+=3;
				if(tmp1 == 0) self.flags |= 0x0040;
				else self.flags &= 0xFFBF;
				var tmp2 = 0;
				for(var i = 0;i<16;i++)
				{
					if(tmp1 & (1<<i)) tmp2 = (tmp2 + 1) & 1;
				}
				if(tmp2&1) self.flags &= 0xFFFB;
				else self.flags |= 0x0004;
				if(tmp1>=0x8000) self.flags |= 0x0080;
				else self.flags &= 0xFF7F;
				break;
			}
			case 0x40:
			{
				self.ax++;
				self.ax &= 0xFFFF;
				//document.getElementById('opcode').innerHTML += '<br />' + 'INC AX';
				if(self.ax==0) self.flags |= 0x0040;
				else self.flags &= 0xFFBF;
				if(self.ax >= 0x8000) self.flags |= 0x0800;
				else self.flags &= 0xF7FF;
				self.ip++;
				break;
			}
			case 0x43:
			{
				self.bx++;
				self.bx &= 0xFFFF;
				//document.getElementById('opcode').innerHTML += '<br />' + 'INC BX';
				if(self.bx==0) self.flags |= 0x0040;
				else self.flags &= 0xFFBF;
				if(self.bx >= 0x8000) self.flags |= 0x0800;
				else self.flags &= 0xF7FF;
				self.ip++;
				break;
			}
			case 0x50:
			{
				//document.getElementById('opcode').innerHTML += '<br />' + 'PUSH AX';
				self.sp-=2;
				self.memory[(self.ss<<4)+self.sp] = self.ax >> 8;
				self.memory[(self.ss<<4)+self.sp+1] = self.ax & 0xFF;
				self.ip++;
				break;
			}
			case 0x51:
			{
				//document.getElementById('opcode').innerHTML += '<br />' + 'PUSH CX';
				self.sp-=2;
				self.memory[(self.ss<<4)+self.sp] = self.cx & 0xFF;
				self.memory[(self.ss<<4)+self.sp+1] = self.cx >> 8;
				self.ip++;
				break;
			}
			case 0x52:
			{
				//document.getElementById('opcode').innerHTML += '<br />' + 'PUSH DX';
				self.sp-=2;
				self.memory[(self.ss<<4)+self.sp] = self.dx & 0xFF;
				self.memory[(self.ss<<4)+self.sp+1] = self.dx >> 8;
				self.ip++;
				break;
			}
			case 0x53:
			{
				//document.getElementById('opcode').innerHTML += '<br />' + 'PUSH BX';
				self.sp-=2;
				self.memory[(self.ss<<4)+self.sp] = self.bx >> 8;
				self.memory[(self.ss<<4)+self.sp+1] = self.bx & 0xFF;
				self.ip++;
				break;
			}
			case 0x55:
			{
				//document.getElementById('opcode').innerHTML += '<br />' + 'PUSH BP';
				self.sp-=2;
				self.memory[(self.ss<<4)+self.sp] = self.bp >> 8;
				self.memory[(self.ss<<4)+self.sp+1] = self.bp & 0xFF;
				self.ip++;
				break;
			}
			case 0x56:
			{
				//document.getElementById('opcode').innerHTML += '<br />' + 'PUSH SI';
				self.sp-=2;
				self.memory[(self.ss<<4)+self.sp] = self.si >> 8;
				self.memory[(self.ss<<4)+self.sp+1] = self.si & 0xFF;
				self.ip++;
				break;
			}
			case 0x57:
			{
				//document.getElementById('opcode').innerHTML += '<br />' + 'PUSH DI';
				self.sp-=2;
				self.memory[(self.ss<<4)+self.sp] = self.di >> 8;
				self.memory[(self.ss<<4)+self.sp+1] = self.di & 0xFF;
				self.ip++;
				break;
			}
			case 0x58:
			{
				//document.getElementById('opcode').innerHTML += '<br />' + 'POP AX';
				self.ax = (self.memory[(self.ss<<4)+self.sp]<<8)|self.memory[(self.ss<<4)+self.sp+1];
				self.sp += 2;
				self.ip++;
				break;
			}
			case 0x70:
			{
				//document.getElementById('opcode').innerHTML += '<br />' + 'JO ' + self.memory[(self.cs<<4)+self.ip+1];
				var tmp = self.memory[(self.cs<<4)+self.ip+1];
				if(self.flags & 0x0800)
				{
					if(self.memory[(self.cs<<4)+self.ip+1] >= 0x80)
					{
						self.ip -= (~tmp + 1) & 0xFF;
					}
					else self.ip += tmp;
				}
				self.ip += 2;
				break;
			}
			case 0x71:
			{
				//document.getElementById('opcode').innerHTML += '<br />' + 'JNO ' + self.memory[(self.cs<<4)+self.ip+1];
				var tmp = self.memory[(self.cs<<4)+self.ip+1];
				if((~self.flags) & 0x0800)
				{
					if(self.memory[(self.cs<<4)+self.ip+1] >= 0x80)
					{
						self.ip -= (~tmp + 1) & 0xFF;
					}
					else self.ip += tmp;
				}
				self.ip += 2;
				break;
			}
			case 0x72:
			{
				//document.getElementById('opcode').innerHTML += '<br />' + 'JC ' + self.memory[(self.cs<<4)+self.ip+1];
				var tmp = self.memory[(self.cs<<4)+self.ip+1];
				if(self.flags & 0x0001)
				{
					if(self.memory[(self.cs<<4)+self.ip+1] >= 0x80)
					{
						self.ip -= (~tmp + 1) & 0xFF;
					}
					else self.ip += tmp;
				}
				self.ip += 2;
				break;
			}
			case 0x73:
			{
				//document.getElementById('opcode').innerHTML += '<br />' + 'JNC ' + self.memory[(self.cs<<4)+self.ip+1];
				var tmp = self.memory[(self.cs<<4)+self.ip+1];
				if((~self.flags) & 0x0001)
				{
					if(self.memory[(self.cs<<4)+self.ip+1] >= 0x80)
					{
						self.ip -= (~tmp + 1) & 0xFF;
					}
					else self.ip += tmp;
				}
				self.ip += 2;
				break;
			}
			case 0x74:
			{
				//document.getElementById('opcode').innerHTML += '<br />' + 'JZ ' + self.memory[(self.cs<<4)+self.ip+1];
				var tmp = self.memory[(self.cs<<4)+self.ip+1];
				if(self.flags & 0x0040)
				{
					if(self.memory[(self.cs<<4)+self.ip+1] >= 0x80)
					{
						self.ip -= (~tmp + 1) & 0xFF;
					}
					else self.ip += tmp;
				}
				self.ip += 2;
				break;
			}
			case 0x75:
			{
				//document.getElementById('opcode').innerHTML += '<br />' + 'JNZ ' + self.memory[(self.cs<<4)+self.ip+1];
				var tmp = self.memory[(self.cs<<4)+self.ip+1];
				if((~self.flags) & 0x0040)
				{
					if(self.memory[(self.cs<<4)+self.ip+1] >= 0x80)
					{
						self.ip -= (~tmp + 1) & 0xFF;
					}
					else self.ip += tmp;
				}
				self.ip += 2;
				break;
			}
			case 0x78:
			{
				//document.getElementById('opcode').innerHTML += '<br />' + 'JS ' + self.memory[(self.cs<<4)+self.ip+1];
				var tmp = self.memory[(self.cs<<4)+self.ip+1];
				if(self.flags & 0x0080)
				{
					if(self.memory[(self.cs<<4)+self.ip+1] >= 0x80)
					{
						self.ip -= (~tmp + 1) & 0xFF;
					}
					else self.ip += tmp;
				}
				self.ip += 2;
				break;
			}
			case 0x7A:
			{
				//document.getElementById('opcode').innerHTML += '<br />' + 'JP ' + self.memory[(self.cs<<4)+self.ip+1];
				var tmp = self.memory[(self.cs<<4)+self.ip+1];
				if(self.flags & 0x0004)
				{
					if(self.memory[(self.cs<<4)+self.ip+1] >= 0x80)
					{
						self.ip -= (~tmp + 1) & 0xFF;
					}
					else self.ip += tmp;
				}
				self.ip += 2;
				break;
			}
			case 0x7B:
			{
				//document.getElementById('opcode').innerHTML += '<br />' + 'JNP ' + self.memory[(self.cs<<4)+self.ip+1];
				var tmp = self.memory[(self.cs<<4)+self.ip+1];
				if(~(self.flags & 0x0004) & 0x0004)
				{
					if(tmp & 0x80)
					{
						self.ip -= (~tmp + 1) & 0xFF;
					}
					else self.ip += tmp;
				}
				self.ip += 2;
				break;
			}
			case 0x80:
			{
				var modrm = self.memory[((self.cs<<4)+self.ip)+1];
				switch(modrm)
				{
					case 0xC7:
					{
						var tmp = self.memory[((self.cs<<4)+self.ip)+2];
						//document.getElementById('opcode').innerHTML += '<br />' + 'ADD BH, ' + tmp;
						self.bx = (self.bx & 0xFF) | ((self.bx & 0xFF00) + (tmp << 8));
						break;
					}
					case 0xE3:
					{
						var tmp = self.memory[((self.cs<<4)+self.ip)+2];
						//document.getElementById('opcode').innerHTML += '<br />' + 'AND BL, ' + tmp;
						self.bx = (self.bx & 0xFF00) | (((self.bx & 0xFF) & tmp)&0xFF);
						break;
					}
					case 0xFB:
					{
						var tmp = self.memory[((self.cs<<4)+self.ip)+2];
						//document.getElementById('opcode').innerHTML += '<br />' + 'CMP BL, ' + tmp;
						var tmp1 = self.bx & 0xFF;
						tmp1 -= tmp;
						if(tmp1 == 0) self.flags |= 0x0040;
						else self.flags &= 0xFFBF;
						var tmp2 = 0;
						for(var i = 0;i<8;i++)
						{
							if(tmp1 & (1<<i)) tmp2 = (tmp2 + 1) & 1;
						}
						if(tmp2&1) self.flags &= 0xFFFB;
						else self.flags |= 0x0004;
						if(tmp1>=0x80) self.flags |= 0x0080;
						else self.flags &= 0xFF7F;
						break;
					}
					case 0xFC:
					{
						var tmp = self.memory[((self.cs<<4)+self.ip)+2];
						//document.getElementById('opcode').innerHTML += '<br />' + 'CMP AH, ' + tmp;
						var tmp1 = (self.ax & 0xFF00) >> 8;
						tmp1 -= tmp;
						if(tmp1 == 0) self.flags |= 0x0040;
						else self.flags &= 0xFFBF;
						var tmp2 = 0;
						for(var i = 0;i<8;i++)
						{
							if(tmp1 & (1<<i)) tmp2 = (tmp2 + 1) & 1;
						}
						if(tmp2&1) self.flags &= 0xFFFB;
						else self.flags |= 0x0004;
						if(tmp1>=0x80) self.flags |= 0x0080;
						else self.flags &= 0xFF7F;
						break;
					}
					case 0xFF:
					{
						var tmp = self.memory[((self.cs<<4)+self.ip)+2];
						//document.getElementById('opcode').innerHTML += '<br />' + 'CMP BH, ' + tmp;
						var tmp1 = (self.bx & 0xFF00) >> 8;
						tmp1 -= tmp;
						if(tmp1 == 0) self.flags |= 0x0040;
						else self.flags &= 0xFFBF;
						var tmp2 = 0;
						for(var i = 0;i<8;i++)
						{
							if(tmp1 & (1<<i)) tmp2 = (tmp2 + 1) & 1;
						}
						if(tmp2&1) self.flags &= 0xFFFB;
						else self.flags |= 0x0004;
						if(tmp1>=0x80) self.flags |= 0x0080;
						else self.flags &= 0xFF7F;
						break;
					}
				}
				self.ip+=3;
				break;
			}
			case 0x83:
			{
				var modrm = self.memory[((self.cs<<4)+self.ip)+1];
				switch(modrm)
				{
					case 0xC2:
					{
						var tmp = self.memory[((self.cs<<4)+self.ip)+2];
						//document.getElementById('opcode').innerHTML += '<br />' + 'ADD DX, ' + tmp;
						self.dx += tmp;
						break;
					}
				}
				self.ip+=3;
				break;
			}
			case 0x89:
			{
				var modrm = self.memory[((self.cs<<4)+self.ip)+1];
				switch(modrm)
				{
					case 0x36:
					{
						var tmp = (self.memory[((self.cs<<4)+self.ip)+2]<<8)|self.memory[((self.cs<<4)+self.ip)+1];
						//document.getElementById('opcode').innerHTML += '<br />' + 'MOV WORD PTR DS:' + tmp + ', SI';
						self.memory[((self.ds<<4)+tmp)] = self.si >> 8;
						self.memory[((self.ds<<4)+tmp)+1] = self.si & 0xFF;
						self.ip+=2;
						break;
					}
				}
				self.ip+=2;
				break;
			}
			case 0x89:
			{
				var modrm = self.memory[((self.cs<<4)+self.ip)+1];
				switch(modrm)
				{
					case 0x1E:
					{
						var tmp = (self.memory[((self.cs<<4)+self.ip)+2]<<8)|self.memory[((self.cs<<4)+self.ip)+1];
						//document.getElementById('opcode').innerHTML += '<br />' + 'MOV BL, BYTE PTR DS:' + tmp;
						self.memory[(self.ds<<4)+tmp] = self.bx & 0xFF;
						self.ip+=2;
						break;
					}
				}
				self.ip+=2;
				break;
			}
			case 0x8B:
			{
				var modrm = self.memory[((self.cs<<4)+self.ip)+1];
				switch(modrm)
				{
					case 0x17:
					{
						//document.getElementById('opcode').innerHTML += '<br />' + 'MOV DX, WORD PTR DS:[BX]';
						var tmp2 = (self.memory[((self.ds<<4)+self.bx)+1]<<8)|self.memory[((self.ds<<4)+self.bx)];
						self.dx = tmp2;
						break;
					}
					case 0x36:
					{
						var tmp = (self.memory[((self.cs<<4)+self.ip)+2]<<8)|self.memory[((self.cs<<4)+self.ip)+1];
						//document.getElementById('opcode').innerHTML += '<br />' + 'MOV SI, WORD PTR DS:' + tmp;
						var tmp2 = (self.memory[((self.ds<<4)+tmp)+1]<<8)|self.memory[((self.ds<<4)+tmp)];
						self.si = tmp2;
						self.ip+=2;
						break;
					}
					case 0xCD:
					{
						//document.getElementById('opcode').innerHTML += '<br />' + 'MOV CX, BP';
						self.cx = self.bp;
						break;
					}
					case 0xD4:
					{
						//document.getElementById('opcode').innerHTML += '<br />' + 'MOV DX, SP';
						self.dx = self.sp;
						break;
					}
					case 0xD8:
					{
						//document.getElementById('opcode').innerHTML += '<br />' + 'MOV BX, AX';
						self.bx = self.ax;
						break;
					}
					case 0xE1:
					{
						//document.getElementById('opcode').innerHTML += '<br />' + 'MOV SP, CX';
						self.sp = self.cx;
						break;
					}
					case 0xE5:
					{
						//document.getElementById('opcode').innerHTML += '<br />' + 'MOV SP, BP';
						self.sp = self.bp;
						break;
					}
					case 0xE8:
					{
						//document.getElementById('opcode').innerHTML += '<br />' + 'MOV BP, AX';
						self.bp = self.ax;
						break;
					}
					case 0xEB:
					{
						//document.getElementById('opcode').innerHTML += '<br />' + 'MOV BP, BX';
						self.bp = self.bx;
						break;
					}
					case 0xEC:
					{
						//document.getElementById('opcode').innerHTML += '<br />' + 'MOV BP, SP';
						self.bp = self.sp;
						break;
					}
				}
				self.ip+=2;
				break;
			}
			case 0x8C:
			{
				var modrm = self.memory[(self.cs<<4)+self.ip+1];
				switch(modrm)
				{
					case 0xC0:
					{
						//document.getElementById('opcode').innerHTML += '<br />' + 'MOV AX, ES';
						self.ax = self.es;
						break;
					}
					case 0xC7:
					{
						//document.getElementById('opcode').innerHTML += '<br />' + 'MOV DI, ES';
						self.di = self.es;
						break;
					}
					case 0xC8:
					{
						//document.getElementById('opcode').innerHTML += '<br />' + 'MOV AX, CS';
						self.ax = self.cs;
						break;
					}
					case 0xD6:
					{
						//document.getElementById('opcode').innerHTML += '<br />' + 'MOV SI, SS';
						self.si = self.ss;
						break;
					}
					case 0xD8:
					{
						//document.getElementById('opcode').innerHTML += '<br />' + 'MOV AX, DS';
						self.ax = self.ds;
						break;
					}
				}
				self.ip+=2;
				break;
			}
			case 0x8E:
			{
				var modrm = self.memory[((self.cs<<4)+self.ip)+1];
				switch(modrm)
				{
					case 0xC0:
					{
						//document.getElementById('opcode').innerHTML += '<br />' + 'MOV ES, AX';
						self.es = self.ax;
						break;
					}
					case 0xC3:
					{
						//document.getElementById('opcode').innerHTML += '<br />' + 'MOV ES, BX';
						self.es = self.bx;
						break;
					}
					case 0xC6:
					{
						//document.getElementById('opcode').innerHTML += '<br />' + 'MOV ES, SI';
						self.es = self.si;
						break;
					}
					case 0xD0:
					{
						//document.getElementById('opcode').innerHTML += '<br />' + 'MOV SS, AX';
						self.ss = self.ax;
						break;
					}
					case 0xD2:
					{
						//document.getElementById('opcode').innerHTML += '<br />' + 'MOV SS, DX';
						self.ss = self.dx;
						break;
					}
					case 0xD8:
					{
						//document.getElementById('opcode').innerHTML += '<br />' + 'MOV DS, AX';
						self.ds = self.ax;
						break;
					}
					case 0xDB:
					{
						//document.getElementById('opcode').innerHTML += '<br />' + 'MOV DS, BX';
						self.ds = self.bx;
						break;
					}
					case 0xDF:
					{
						//document.getElementById('opcode').innerHTML += '<br />' + 'MOV DS, DI';
						self.ds = self.di;
						break;
					}
				}
				self.ip+=2;
				break;
			}
			case 0x90:
			{
				self.ip++;
				//document.getElementById('opcode').innerHTML += '<br />NOP';
				break;
			}
			case 0xA2:
			{
				var tmp = (self.memory[((self.cs<<4)+self.ip)+2]<<8)|self.memory[((self.cs<<4)+self.ip)+1];
				//document.getElementById('opcode').innerHTML += '<br />' + 'MOV BYTE PTR DS:' + tmp + ', AL';
				var tmp1 = (self.ds<<4)+tmp;
				self.memory[tmp1] = self.ax & 0xFF;
				self.ip+=3;
				break;
			}
			case 0xA3:
			{
				var tmp = (self.memory[((self.cs<<4)+self.ip)+2]<<8)|self.memory[((self.cs<<4)+self.ip)+1];
				//document.getElementById('opcode').innerHTML += '<br />' + 'MOV WORD PTR DS:' + tmp + ', AX';
				var tmp1 = (self.ds<<4)+tmp;
				self.memory[tmp1] = self.ax >> 8;
				self.memory[tmp1+1] = self.ax & 0xFF;
				self.ip+=3;
				break;
			}
			case 0xA5:
			{
				//document.getElementById('opcode').innerHTML += '<br />' + 'MOVSW';
				self.memory[(self.es<<4)+self.di] = self.memory[(self.ds<<4)+self.si];
				self.memory[(self.es<<4)+self.di+1] = self.memory[(self.ds<<4)+self.si+1];
				if((~self.flags) &  0x0400)
				{
					self.di += 2;
					self.si += 2;
				}
				else
				{
					self.di -= 2;
					self.si -= 2;
				}
				self.ip++;
				break;
			}
			case 0xAB:
			{
				//document.getElementById('opcode').innerHTML += '<br />' + 'STOSW';
				self.memory[(self.es<<4)+self.di] = (self.ax >> 8) & 0xFF;
				self.memory[(self.es<<4)+self.di+1] = (self.ax & 0xFF);
				if((~self.flags) &  0x0400) self.di += 2;
				else self.di -= 2;
				self.ip++;
				break;
			}
			case 0xB0:
			{
				self.ax = (self.ax & 0xFF00) | self.memory[((self.cs<<4)+self.ip)+1];
				//document.getElementById('opcode').innerHTML += '<br />' + 'MOV AL, ' + (self.ax & 0xFF);
				self.ip+=2;
				break;
			}
			case 0xB1:
			{
				self.cx = (self.cx & 0xFF00) | self.memory[((self.cs<<4)+self.ip)+1];
				//document.getElementById('opcode').innerHTML += '<br />' + 'MOV CL, ' + (self.cx & 0xFF);
				self.ip+=2;
				break;
			}
			case 0xB4:
			{
				self.ax = (self.ax & 0xFF) | (self.memory[((self.cs<<4)+self.ip)+1]<<8);
				//document.getElementById('opcode').innerHTML += '<br />' + 'MOV AH, ' + ((self.ax & 0xFF00)>>8);
				self.ip+=2;
				break;
			}
			case 0xB8:
			{
				self.ax = (self.memory[((self.cs<<4)+self.ip)+2]<<8)|self.memory[((self.cs<<4)+self.ip)+1];
				//document.getElementById('opcode').innerHTML += '<br />' + 'MOV AX, ' + self.ax;
				self.ip+=3;
				break;
			}
			case 0xB9:
			{
				self.cx = (self.memory[((self.cs<<4)+self.ip)+2]<<8)|self.memory[((self.cs<<4)+self.ip)+1];
				//document.getElementById('opcode').innerHTML += '<br />' + 'MOV CX, ' + self.cx;
				self.ip+=3;
				break;
			}
			case 0xBA:
			{
				self.dx = (self.memory[((self.cs<<4)+self.ip)+2]<<8)|self.memory[((self.cs<<4)+self.ip)+1];
				//document.getElementById('opcode').innerHTML += '<br />' + 'MOV DX, ' + self.dx;
				self.ip+=3;
				break;
			}
			case 0xBB:
			{
				self.bx = (self.memory[((self.cs<<4)+self.ip)+2]<<8)|self.memory[((self.cs<<4)+self.ip)+1];
				//document.getElementById('opcode').innerHTML += '<br />' + 'MOV BX, ' + self.bx;
				self.ip+=3;
				break;
			}
			case 0xBC:
			{
				self.sp = (self.memory[((self.cs<<4)+self.ip)+2]<<8)|self.memory[((self.cs<<4)+self.ip)+1];
				//document.getElementById('opcode').innerHTML += '<br />' + 'MOV SP, ' + self.sp;
				self.ip+=3;
				break;
			}
			case 0xBD:
			{
				self.bp = (self.memory[((self.cs<<4)+self.ip)+2]<<8)|self.memory[((self.cs<<4)+self.ip)+1];
				//document.getElementById('opcode').innerHTML += '<br />' + 'MOV BP, ' + self.bp;
				self.ip+=3;
				break;
			}
			case 0xBE:
			{
				self.si = (self.memory[((self.cs<<4)+self.ip)+2]<<8)|self.memory[((self.cs<<4)+self.ip)+1];
				//document.getElementById('opcode').innerHTML += '<br />' + 'MOV SI, ' + self.si;
				self.ip+=3;
				break;
			}
			case 0xC3:
			{
				//document.getElementById('opcode').innerHTML += '<br />' + 'RET';
				self.ip = (self.memory[(self.ss<<4)+self.sp]<<8)|self.memory[(self.ss<<4)+self.sp+1];
				self.sp+=2;
				break;
			}
			case 0xC7:
			{
				var modrm = self.memory[((self.cs<<4)+self.ip)+1];
				switch(modrm)
				{
					case 0x06:
					{
						self.memory[(self.ds<<4)+((self.memory[(self.cs<<4)+self.ip+3]<<8)|self.memory[(self.cs<<4)+self.ip+2])] = (self.memory[((self.cs<<4)+self.ip)+5]<<8)|self.memory[((self.cs<<4)+self.ip)+4];
						//document.getElementById('opcode').innerHTML += '<br />' + 'MOV WORD PTR DS:' + ((self.memory[(self.cs<<4)+self.ip+3]<<8)|self.memory[(self.cs<<4)+self.ip+2]) + ', ' + (self.memory[((self.cs<<4)+self.ip)+5]<<8)|self.memory[((self.cs<<4)+self.ip)+4];
						self.ip+=2;
						break;
					}
				}
				self.ip+=4;
				break;
			}
			case 0xCB:
			{
				//document.getElementById('opcode').innerHTML += '<br />' + 'RETF';
				self.ip = (self.memory[(self.ss<<4)+self.sp+1]<<8)|self.memory[(self.ss<<4)+self.sp];
				self.sp+=2;
				self.cs = (self.memory[(self.ss<<4)+self.sp+1]<<8)|self.memory[(self.ss<<4)+self.sp];
				self.sp+=2;
				break;
			}
			case 0xCD:
			{
				var tmp = self.memory[(self.cs<<4)+self.ip+1];
				//document.getElementById('opcode').innerHTML += '<br />' + 'INT ' + tmp;
				self.sp -= 2;
				self.memory[(self.ss<<4)+self.sp] = self.flags & 0xFF;
				self.memory[(self.ss<<4)+self.sp] = self.flags >> 8;
				self.flags &= 0xFCFF;
				self.sp -= 2;
				self.memory[(self.ss<<4)+self.sp] = self.cs & 0xFF;
				self.memory[(self.ss<<4)+self.sp] = self.cs >> 8;
				self.sp -= 2;
				self.memory[(self.ss<<4)+self.sp] = (self.ip+2) & 0xFF;
				self.memory[(self.ss<<4)+self.sp] = (self.ip+2) >> 8;
				self.cs = (self.memory[(tmp<<2)+2]<<8)|self.memory[(tmp<<2)+3];
				self.ip = (self.memory[(tmp<<2)+1]<<8)|self.memory[(tmp<<2)];
				break;
			}
			case 0xD1:
			{
				var modrm = self.memory[((self.cs<<4)+self.ip)+1];
				switch(modrm)
				{
					case 0xE0:
					{
						if(self.ax >= 0x8000) self.flags |= 0x0001;
						else self.flags &= 0xFFFE;
						self.ax = (self.ax << 1) & 0xFFFF;
						//document.getElementById('opcode').innerHTML += '<br />' + 'SHL AX, 1';
						if(self.ax == 0) self.flags |= 0x0040;
						else self.flags &= 0xFFBF;
						break;
					}
					case 0xEB:
					{
						if(self.bx & 1) self.flags |= 0x0001;
						else self.flags &= 0xFFFE;
						self.bx = (self.bx >> 1) & 0xFFFF;
						//document.getElementById('opcode').innerHTML += '<br />' + 'SHR BX, 1';
						if(self.bx == 0) self.flags |= 0x0040;
						else self.flags &= 0xFFBF;
						break;
					}
				}
				self.ip+=2;
				break;
			}
			case 0xD3:
			{
				var modrm = self.memory[((self.cs<<4)+self.ip)+1];
				switch(modrm)
				{
					case 0xE8:
					{
						if(self.ax & 1) self.flags |= 0x0001;
						else self.flags &= 0xFFFE;
						self.ax = (self.ax >> (self.cx & 0xFF)) & 0xFFFF;
						//document.getElementById('opcode').innerHTML += '<br />' + 'SHR AX, CL';
						if(self.ax == 0) self.flags |= 0x0040;
						else self.flags &= 0xFFBF;
						break;
					}
				}
				self.ip+=2;
				break;
			}
			case 0xE2:
			{
				//document.getElementById('opcode').innerHTML += '<br />' + 'LOOP ' + self.memory[(self.cs<<4)+self.ip+1];
				var tmp = self.memory[(self.cs<<4)+self.ip+1];
				self.cx--;
				if(self.cx!=0)
				{
					if(self.memory[(self.cs<<4)+self.ip+1] >= 0x80)
					{
						self.ip -= (~tmp + 1) & 0xFF;
					}
					else self.ip += tmp;
				}
				self.ip += 2;
				break;
			}
			case 0xE6:
			{
				//document.getElementById('opcode').innerHTML += '<br />' + 'OUT ' + self.memory[(self.cs<<4)+self.ip+1] + ', AL';
				self.io_w(self.memory[(self.cs<<4)+self.ip+1],self.ax&0xFF);
				self.ip+=2;
				break;
			}
			case 0xE8:
			{
				//document.getElementById('opcode').innerHTML += '<br />' + 'CALL ' + (self.memory[((self.cs<<4)+self.ip)+2]<<8)|self.memory[((self.cs<<4)+self.ip)+1];
				var tmp = (self.memory[((self.cs<<4)+self.ip)+2]<<8)|self.memory[((self.cs<<4)+self.ip)+1];
				self.sp -= 2;
				self.memory[(self.ss<<4)+self.sp] = (self.ip + 3) >> 8;
				self.memory[(self.ss<<4)+self.sp+1] = (self.ip + 3) & 0xFF;
				if(tmp >= 0x8000)
				{
					self.ip -= (~tmp + 1) & 0xFF;
				}
				else self.ip += tmp;
				self.ip += 3;
				break;
			}
			case 0xEA:
			{
				var tmp = self.ip;
				self.ip = (self.memory[(self.cs<<4)+tmp+2]<<8)|self.memory[(self.cs<<4)+tmp+1];
				self.cs = (self.memory[(self.cs<<4)+tmp+4]<<8)|self.memory[(self.cs<<4)+tmp+3];
				//document.getElementById('opcode').innerHTML += '<br />' + 'JMP ' + self.cs + ':' + self.ip;
				break;
			}
			case 0xEB:
			{
				//document.getElementById('opcode').innerHTML += '<br />' + 'JMP ' + self.memory[(self.cs<<4)+self.ip+1];
				var tmp = self.memory[(self.cs<<4)+self.ip+1];
				if(self.memory[(self.cs<<4)+self.ip+1] >= 0x80)
				{
					self.ip -= (~tmp + 1) & 0xFF;
				}
				else self.ip += tmp;
				self.ip += 2;
				break;
			}
			case 0xEC:
			{
				//document.getElementById('opcode').innerHTML += '<br />' + 'IN AL, DX';
				self.ax = (self.ax & 0xFF00) | self.io_r(self.dx);
				self.ip++;
				break;
			}
			case 0xEE:
			{
				//document.getElementById('opcode').innerHTML += '<br />' + 'OUT DX, AL';
				self.io_w(self.dx,self.ax&0xFF);
				self.ip++;
				break;
			}
			case 0xF3:
			{
				var op2 = self.memory[((self.cs<<4)+self.ip)+1];
				switch(op2)
				{
					case 0xAB:
					{
						//document.getElementById('opcode').innerHTML += '<br />' + 'REP STOSW';
						for(;self.cx>0;self.cx--)
						{
							self.memory[(self.es<<4)+self.di] = (self.ax >> 8) & 0xFF;
							self.memory[(self.es<<4)+self.di+1] = (self.ax & 0xFF);
							if((~self.flags) &  0x0400) self.di += 2;
							else self.di -= 2;
						}
						break;
					}
				}
				self.ip+=2;
				break;
			}
			case 0xF6:
			{
				var modrm = self.memory[((self.cs<<4)+self.ip)+1];
				switch(modrm)
				{
					case 0xD0:
					{
						self.ax = ((self.ax & 0xFF00) | (~(self.ax & 0xFF) & 0xFF)) & 0xFFFF;
						//document.getElementById('opcode').innerHTML += '<br />' + 'NOT AL';
						if((self.ax & 0xFF) == 0) self.flags |= 0x0040;
						else self.flags &= 0xFFBF;
						break;
					}
				}
				self.ip+=2;
				break;
			}
			case 0xF7:
			{
				var modrm = self.memory[((self.cs<<4)+self.ip)+1];
				switch(modrm)
				{
					case 0xD0:
					{
						self.ax = (~self.ax) & 0xFFFF;
						//document.getElementById('opcode').innerHTML += '<br />' + 'NOT AX';
						if(self.ax == 0) self.flags |= 0x0040;
						else self.flags &= 0xFFBF;
						break;
					}
				}
				self.ip+=2;
				break;
			}
			case 0xFA:
			{
				self.flags &= 0xFDFF;
				//document.getElementById('opcode').innerHTML += '<br />' + 'CLI';
				self.ip++;
				break;
			}
			case 0xFB:
			{
				self.flags |= 0x0200;
				//document.getElementById('opcode').innerHTML += '<br />' + 'STI';
				self.ip++;
				break;
			}
			case 0xFC:
			{
				self.flags &= 0xFBFF;
				//document.getElementById('opcode').innerHTML += '<br />' + 'CLD';
				self.ip++;
				break;
			}
			case 0xFE:
			{
				var modrm = self.memory[((self.cs<<4)+self.ip)+1];
				switch(modrm)
				{
					case 0xC0:
					{
						self.ax = (self.ax & 0xFF00) | (((self.ax&0xFF)+1)&0xFF);
						//document.getElementById('opcode').innerHTML += '<br />' + 'INC AL';
						if((self.ax & 0xFF) == 0) self.flags |= 0x0040;
						else self.flags &= 0xFFBF;
						break;
					}
				}
				self.ip+=2;
				break;
			}
			default:
			{
			}
		}
		self.dumpregs = function()
		{
			//document.getElementById('opcode').innerHTML += '<br />' + self.ip;
		}
		self.dumpregs();
		
	};
}