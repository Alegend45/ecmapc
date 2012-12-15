function PIT()
{
	this.accessm = 0;
	this.mode = 0;
	this.counter0 = 0;
	this.counter1 = 0;
	this.counter2 = 0;
}

function DMAchan()
{
	this.mode = 0;
	this.length = 0;
}

function DMA()
{
	this.chan0 = new DMAchan();
	this.chan1 = new DMAchan();
	this.chan2 = new DMAchan();
	this.chan3 = new DMAchan();
	this.enabled = false;
}

function CPU(type,mem)
{
	this.type = type;
	this.ax = 0;
	this.bx = 0;
	this.cx = 0;
	this.dx = 0;
	this.cs = 0xF000;
	this.ip = 0xFFF0;
	this.ss = 0;
	this.ds = 0;
	this.es = 0;
	this.flags = 2;
	this.memory = mem;
	this.pit = new PIT();
	this.dma = new DMA();
	this.io_r = function(addr)
	{
	}
	this.io_w = function(addr, data)
	{
		switch(addr)
		{
			case 0x01:
			{
				this.dma.chan0.length = (this.dma.chan0.length & 0xFF00) | (data & 0xFF);
				break;
			}
			case 0x08:
			{
				this.dma.enabled = (data & 4) ? true : false;
				break;
			}
			case 0x0A:
			{
				switch(data & 3)
				{
					case 0:
					{
						this.dma.chan0.masked = (data & 4) ? true : false;
						break;
					}
					case 1:
					{
						this.dma.chan1.mode = (data & 4) ? true : false;
						break;
					}
					case 2:
					{
						this.dma.chan2.mode = (data & 4) ? true : false;
						break;
					}
					case 3:
					{
						this.dma.chan3.mode = (data & 4) ? true : false;
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
						this.dma.chan0.mode = (data & 0xFC) >> 2;
						break;
					}
					case 1:
					{
						this.dma.chan1.mode = (data & 0xFC) >> 2;
						break;
					}
					case 2:
					{
						this.dma.chan2.mode = (data & 0xFC) >> 2;
						break;
					}
					case 3:
					{
						this.dma.chan3.mode = (data & 0xFC) >> 2;
						break;
					}
				}
				break;
			}
			case 0x41:
			{
				switch(this.pit.accessm)
				{
					case 1:
					{
						switch(data & 0xC0)
						{
							case 0x40:
							{
								this.pit.counter1 = (this.pit.counter1 & 0xFF00) | (data & 0xFF);
							}
						}
						break;
					}
				}
				break;
			}
			case 0x43:
			{
				this.pit.accessm = (data & 0x30) >> 4;
				this.pit.mode = (data & 0x0E) >> 1;
				break;
			}
			default:
			{
				break;
			}
		}
	}
	this.exec = function()
	{
		this.op = this.memory[(this.cs<<4)+this.ip];
		document.getElementById('opcode').innerHTML += '<br />' + this.op;
		switch(this.op)
		{
			case 0x05:
			{
				var tmp = (this.memory[((this.cs<<4)+this.ip)+2]<<8)|this.memory[((this.cs<<4)+this.ip)+1];
				this.ax = (this.ax + tmp) & 0xFFFF;
				document.getElementById('opcode').innerHTML += '<br />ADD AX, ' + tmp;
				this.ip+=3;
				if(this.ax == 0) this.flags |= 0x0040;
				else this.flags &= 0xFFBF;
				var tmp = 0;
				for(var i = 0;i<16;i++)
				{
					if(this.ax & (1<<i)) tmp = (tmp + 1) & 1;
				}
				if(tmp&1) this.flags &= 0xFFFB;
				else this.flags |= 0x0004;
				break;
			}
			case 0x2D:
			{
				var tmp = (this.memory[((this.cs<<4)+this.ip)+2]<<8)|this.memory[((this.cs<<4)+this.ip)+1];
				this.ax = (this.ax - tmp) & 0xFFFF;
				document.getElementById('opcode').innerHTML += '<br />' + 'SUB AX, ' + tmp;
				this.ip+=3;
				if(this.ax == 0) this.flags |= 0x0040;
				else this.flags &= 0xFFBF;
				var tmp2 = 0;
				for(var i = 0;i<16;i++)
				{
					if(this.ax & (1<<i)) tmp2 = (tmp2 + 1) & 1;
				}
				if(tmp2&1) this.flags &= 0xFFFB;
				else this.flags |= 0x0004;
				if(this.ax>=0x8000) this.flags |= 0x0080;
				else this.flags &= 0xFF7F;
				break;
			}
			case 0x33:
			{
				var modrm = this.memory[((this.cs<<4)+this.ip)+1];
				switch(modrm)
				{
					case 0xC0:
					{
						this.ax = 0; //XOR 0,0 gives 0, and XOR 1,1 gives 0, so XORing any value with itself gives 0.
						document.getElementById('opcode').innerHTML += '<br />' + 'XOR AX, AX';
						this.flags &= 0xFFBA;
						this.flags |= 0x0044;
						break;
					}
				}
				this.ip+=2;
				break;
			}
			case 0x35:
			{
				var tmp = (this.memory[((this.cs<<4)+this.ip)+2]<<8)|this.memory[((this.cs<<4)+this.ip)+1];
				this.ax = (this.ax ^ tmp) & 0xFFFF;
				document.getElementById('opcode').innerHTML += '<br />' + 'XOR AX, ' + tmp;
				this.ip+=3;
				if(this.ax == 0) this.flags |= 0x0040;
				else this.flags &= 0xFFBF;
				var tmp2 = 0;
				for(var i = 0;i<16;i++)
				{
					if(this.ax & (1<<i)) tmp2 = (tmp2 + 1) & 1;
				}
				if(tmp2&1) this.flags &= 0xFFFB;
				else this.flags |= 0x0004;
				if(this.ax>=0x8000) this.flags |= 0x0080;
				else this.flags &= 0xFF7F;
				break;
			}
			case 0x3D:
			{
				var tmp = (this.memory[((this.cs<<4)+this.ip)+2]<<8)|this.memory[((this.cs<<4)+this.ip)+1];
				var tmp1 = (this.ax - tmp) & 0xFFFF;
				document.getElementById('opcode').innerHTML += '<br />' + 'CMP AX, ' + tmp;
				this.ip+=3;
				if(tmp1 == 0) this.flags |= 0x0040;
				else this.flags &= 0xFFBF;
				var tmp2 = 0;
				for(var i = 0;i<16;i++)
				{
					if(tmp1 & (1<<i)) tmp2 = (tmp2 + 1) & 1;
				}
				if(tmp2&1) this.flags &= 0xFFFB;
				else this.flags |= 0x0004;
				if(tmp1>=0x8000) this.flags |= 0x0080;
				else this.flags &= 0xFF7F;
				break;
			}
			case 0x40:
			{
				this.ax++;
				this.ax &= 0xFFFF;
				document.getElementById('opcode').innerHTML += '<br />' + 'INC AX';
				if(this.ax==0) this.flags |= 0x0040;
				else this.flags &= 0xFFBF;
				if(this.ax >= 0x8000) this.flags |= 0x0800;
				else this.flags &= 0xF7FF;
				this.ip++;
				break;
			}
			case 0x70:
			{
				document.getElementById('opcode').innerHTML += '<br />' + 'JO ' + this.memory[(this.cs<<4)+this.ip+1];
				var tmp = this.memory[(this.cs<<4)+this.ip+1];
				if(this.flags & 0x0800)
				{
					if(this.memory[(this.cs<<4)+this.ip+1] >= 0x80)
					{
						this.ip -= (~tmp + 1) & 0xFF;
					}
					else this.ip += tmp;
				}
				this.ip += 2;
				break;
			}
			case 0x71:
			{
				document.getElementById('opcode').innerHTML += '<br />' + 'JNO ' + this.memory[(this.cs<<4)+this.ip+1];
				var tmp = this.memory[(this.cs<<4)+this.ip+1];
				if((~this.flags) & 0x0800)
				{
					if(this.memory[(this.cs<<4)+this.ip+1] >= 0x80)
					{
						this.ip -= (~tmp + 1) & 0xFF;
					}
					else this.ip += tmp;
				}
				this.ip += 2;
				break;
			}
			case 0x72:
			{
				document.getElementById('opcode').innerHTML += '<br />' + 'JC ' + this.memory[(this.cs<<4)+this.ip+1];
				var tmp = this.memory[(this.cs<<4)+this.ip+1];
				if(this.flags & 0x0001)
				{
					if(this.memory[(this.cs<<4)+this.ip+1] >= 0x80)
					{
						this.ip -= (~tmp + 1) & 0xFF;
					}
					else this.ip += tmp;
				}
				this.ip += 2;
				break;
			}
			case 0x73:
			{
				document.getElementById('opcode').innerHTML += '<br />' + 'JNC ' + this.memory[(this.cs<<4)+this.ip+1];
				var tmp = this.memory[(this.cs<<4)+this.ip+1];
				if((~this.flags) & 0x0001)
				{
					if(this.memory[(this.cs<<4)+this.ip+1] >= 0x80)
					{
						this.ip -= (~tmp + 1) & 0xFF;
					}
					else this.ip += tmp;
				}
				this.ip += 2;
				break;
			}
			case 0x74:
			{
				document.getElementById('opcode').innerHTML += '<br />' + 'JZ ' + this.memory[(this.cs<<4)+this.ip+1];
				var tmp = this.memory[(this.cs<<4)+this.ip+1];
				if(this.flags & 0x0040)
				{
					if(this.memory[(this.cs<<4)+this.ip+1] >= 0x80)
					{
						this.ip -= (~tmp + 1) & 0xFF;
					}
					else this.ip += tmp;
				}
				this.ip += 2;
				break;
			}
			case 0x75:
			{
				document.getElementById('opcode').innerHTML += '<br />' + 'JNZ ' + this.memory[(this.cs<<4)+this.ip+1];
				var tmp = this.memory[(this.cs<<4)+this.ip+1];
				if((~this.flags) & 0x0040)
				{
					if(this.memory[(this.cs<<4)+this.ip+1] >= 0x80)
					{
						this.ip -= (~tmp + 1) & 0xFF;
					}
					else this.ip += tmp;
				}
				this.ip += 2;
				break;
			}
			case 0x78:
			{
				document.getElementById('opcode').innerHTML += '<br />' + 'JS ' + this.memory[(this.cs<<4)+this.ip+1];
				var tmp = this.memory[(this.cs<<4)+this.ip+1];
				if(this.flags & 0x0080)
				{
					if(this.memory[(this.cs<<4)+this.ip+1] >= 0x80)
					{
						this.ip -= (~tmp + 1) & 0xFF;
					}
					else this.ip += tmp;
				}
				this.ip += 2;
				break;
			}
			case 0x7A:
			{
				document.getElementById('opcode').innerHTML += '<br />' + 'JP ' + this.memory[(this.cs<<4)+this.ip+1];
				var tmp = this.memory[(this.cs<<4)+this.ip+1];
				if(this.flags & 0x0004)
				{
					if(this.memory[(this.cs<<4)+this.ip+1] >= 0x80)
					{
						this.ip -= (~tmp + 1) & 0xFF;
					}
					else this.ip += tmp;
				}
				this.ip += 2;
				break;
			}
			case 0x7B:
			{
				document.getElementById('opcode').innerHTML += '<br />' + 'JNP ' + this.memory[(this.cs<<4)+this.ip+1];
				var tmp = this.memory[(this.cs<<4)+this.ip+1];
				if(~(this.flags & 0x0004) & 0x0004)
				{
					if(tmp & 0x80)
					{
						this.ip -= (~tmp + 1) & 0xFF;
					}
					else this.ip += tmp;
				}
				this.ip += 2;
				break;
			}
			case 0x8B:
			{
				var modrm = this.memory[((this.cs<<4)+this.ip)+1];
				switch(modrm)
				{
					case 0x36:
					{
						var tmp = (this.memory[((this.cs<<4)+this.ip)+2]<<8)|this.memory[((this.cs<<4)+this.ip)+1];
						document.getElementById('opcode').innerHTML += '<br />' + 'MOV SI, WORD PTR DS:' + tmp;
						var tmp2 = (this.memory[((this.ds<<4)+tmp)+1]<<8)|this.memory[((this.ds<<4)+tmp)];
						this.si = tmp2;
						this.ip+=2;
						break;
					}
					case 0xCD:
					{
						document.getElementById('opcode').innerHTML += '<br />' + 'MOV CX, BP';
						this.cx = this.bp;
						break;
					}
					case 0xD4:
					{
						document.getElementById('opcode').innerHTML += '<br />' + 'MOV DX, SP';
						this.dx = this.sp;
						break;
					}
					case 0xD8:
					{
						document.getElementById('opcode').innerHTML += '<br />' + 'MOV BX,AX';
						this.bx = this.ax;
						break;
					}
					case 0xE1:
					{
						document.getElementById('opcode').innerHTML += '<br />' + 'MOV SP, CX';
						this.sp = this.cx;
						break;
					}
					case 0xEB:
					{
						document.getElementById('opcode').innerHTML += '<br />' + 'MOV BP, BX';
						this.bp = this.bx;
						break;
					}
				}
				this.ip+=2;
				break;
			}
			case 0x8C:
			{
				var modrm = this.memory[(this.cs<<4)+this.ip+1];
				switch(modrm)
				{
					case 0xC7:
					{
						document.getElementById('opcode').innerHTML += '<br />' + 'MOV SI, SS';
						this.di = this.es;
						break;
					}
					case 0xD6:
					{
						document.getElementById('opcode').innerHTML += '<br />' + 'MOV SI, SS';
						this.si = this.ss;
						break;
					}
					case 0xD8:
					{
						document.getElementById('opcode').innerHTML += '<br />' + 'MOV AX, DS';
						this.ax = this.ds;
						break;
					}
				}
				this.ip+=2;
				break;
			}
			case 0x8E:
			{
				var modrm = this.memory[((this.cs<<4)+this.ip)+1];
				switch(modrm)
				{
					case 0xC6:
					{
						document.getElementById('opcode').innerHTML += '<br />' + 'MOV ES, SI';
						this.es = this.si;
						break;
					}
					case 0xD2:
					{
						document.getElementById('opcode').innerHTML += '<br />' + 'MOV SS, DX';
						this.ss = this.dx;
						break;
					}
					case 0xD8:
					{
						document.getElementById('opcode').innerHTML += '<br />' + 'MOV DS, AX';
						this.ds = this.ax;
						break;
					}
					case 0xDF:
					{
						document.getElementById('opcode').innerHTML += '<br />' + 'MOV DS, DI';
						this.ds = this.di;
						break;
					}
				}
				this.ip+=2;
				break;
			}
			case 0xB0:
			{
				this.ax = (this.ax & 0xFF00) | this.memory[((this.cs<<4)+this.ip)+1];
				document.getElementById('opcode').innerHTML += '<br />' + 'MOV AL, ' + (this.ax & 0xFF);
				this.ip+=2;
				break;
			}
			case 0xB8:
			{
				this.ax = (this.memory[((this.cs<<4)+this.ip)+2]<<8)|this.memory[((this.cs<<4)+this.ip)+1];
				document.getElementById('opcode').innerHTML += '<br />' + 'MOV AX, ' + this.ax;
				this.ip+=3;
				break;
			}
			case 0xBA:
			{
				this.dx = (this.memory[((this.cs<<4)+this.ip)+2]<<8)|this.memory[((this.cs<<4)+this.ip)+1];
				document.getElementById('opcode').innerHTML += '<br />' + 'MOV DX, ' + this.dx;
				this.ip+=3;
				break;
			}
			case 0xBB:
			{
				this.bx = (this.memory[((this.cs<<4)+this.ip)+2]<<8)|this.memory[((this.cs<<4)+this.ip)+1];
				document.getElementById('opcode').innerHTML += '<br />' + 'MOV BX, ' + this.bx;
				this.ip+=3;
				break;
			}
			case 0xC7:
			{
				var modrm = this.memory[((this.cs<<4)+this.ip)+1];
				switch(modrm)
				{
					case 0x06:
					{
						this.memory[(this.ds<<4)+((this.memory[(this.cs<<4)+this.ip+3]<<8)|this.memory[(this.cs<<4)+this.ip+2])] = (this.memory[((this.cs<<4)+this.ip)+5]<<8)|this.memory[((this.cs<<4)+this.ip)+4];
						document.getElementById('opcode').innerHTML += '<br />' + 'MOV WORD PTR DS:' + ((this.memory[(this.cs<<4)+this.ip+3]<<8)|this.memory[(this.cs<<4)+this.ip+2]) + ', ' + (this.memory[((this.cs<<4)+this.ip)+5]<<8)|this.memory[((this.cs<<4)+this.ip)+4];
						this.ip+=2;
						break;
					}
				}
				this.ip+=4;
				break;
			}
			case 0xD1:
			{
				var modrm = this.memory[((this.cs<<4)+this.ip)+1];
				switch(modrm)
				{
					case 0xE0:
					{
						if(this.ax >= 0x8000) this.flags |= 0x0001;
						else this.flags &= 0xFFFE;
						this.ax = (this.ax << 1) & 0xFFFF;
						document.getElementById('opcode').innerHTML += '<br />' + 'SHL AX, 1';
						if(this.ax == 0) this.flags |= 0x0040;
						else this.flags &= 0xFFBF;
						break;
					}
				}
				this.ip+=2;
				break;
			}
			case 0xEA:
			{
				var tmp = this.ip;
				this.ip = (this.memory[((this.cs<<4)+this.ip)+2]<<8)|this.memory[((this.cs<<4)+this.ip)+1];
				this.cs = (this.memory[((this.cs<<4)+tmp)+4]<<8)|this.memory[((this.cs<<4)+tmp)+3];
				document.getElementById('opcode').innerHTML += '<br />' + 'JMP ' + this.cs + ':' + this.ip;
				break;
			}
			case 0xE6:
			{
				document.getElementById('opcode').innerHTML += '<br />' + 'OUT ' + this.memory[(this.cs<<4)+this.ip+1] + ', AL';
				this.io_w(this.memory[(this.cs<<4)+this.ip+1],this.ax&0xFF);
				this.ip+=2;
				break;
			}
			case 0xEB:
			{
				document.getElementById('opcode').innerHTML += '<br />' + 'JMP ' + this.memory[(this.cs<<4)+this.ip+1];
				var tmp = this.memory[(this.cs<<4)+this.ip+1];
				if(this.memory[(this.cs<<4)+this.ip+1] >= 0x80)
				{
					this.ip -= (~tmp + 1) & 0xFF;
				}
				else this.ip += tmp;
				this.ip += 2;
				break;
			}
			case 0xEE:
			{
				document.getElementById('opcode').innerHTML += '<br />' + 'OUT DX, AL';
				this.io_w(this.dx,this.ax&0xFF);
				this.ip++;
				break;
			}
			case 0xF7:
			{
				var modrm = this.memory[((this.cs<<4)+this.ip)+1];
				switch(modrm)
				{
					case 0xD0:
					{
						this.ax = (~this.ax) & 0xFFFF;
						document.getElementById('opcode').innerHTML += '<br />' + 'SHL AX, 1';
						if(this.ax == 0) this.flags |= 0x0040;
						else this.flags &= 0xFFBF;
						break;
					}
				}
				this.ip+=2;
				break;
			}
			case 0xFA:
			{
				this.flags &= 0xFDFF;
				document.getElementById('opcode').innerHTML += '<br />' + 'CLI';
				this.ip++;
				break;
			}
			case 0xFC:
			{
				this.flags &= 0xFBFF;
				document.getElementById('opcode').innerHTML += '<br />' + 'CLD';
				this.ip++;
				break;
			}
			case 0xFE:
			{
				var modrm = this.memory[((this.cs<<4)+this.ip)+1];
				switch(modrm)
				{
					case 0xC0:
					{
						this.ax = (this.ax & 0xFF00) | (((this.ax&0xFF)+1)&0xFF);
						document.getElementById('opcode').innerHTML += '<br />' + 'INC AL';
						if((this.ax & 0xFF) == 0) this.flags |= 0x0040;
						else this.flags &= 0xFFBF;
						break;
					}
				}
				this.ip+=2;
				break;
			}
			default:
			{
			}
		}
		this.dumpregs = function()
		{
			document.getElementById('opcode').innerHTML += '<br />' + this.ip;
		}
		this.dumpregs();
	};
}